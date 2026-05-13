const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

/* ===============================
   ENV SAFETY
=============================== */
const getEnv = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env: ${key}`);
  return val;
};

const stripe = new Stripe(getEnv("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  getEnv("SUPABASE_URL"),
  getEnv("SUPABASE_SERVICE_ROLE_KEY")
);

/* ===============================
   SAFE FETCH (NODE COMPAT)
=============================== */
const fetchFn =
  global.fetch ||
  ((...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args)));

/* ===============================
   TELEGRAM (NON-BLOCKING)
=============================== */
const sendTelegram = async (text) => {
  const token = process.env.TG_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  if (!token || !chatId) return;

  fetchFn(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  }).catch(() => {});
};

/* ===============================
   IDEMPOTENCY
=============================== */
async function isProcessed(eventId) {
  const { data, error } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

async function markEvent(eventId, payload) {
  await supabase.from("stripe_events").upsert({
    id: eventId,
    ...payload,
    updated_at: new Date().toISOString(),
  });
}

/* ===============================
   CORE: CHECKOUT SUCCESS
=============================== */
async function handleCheckout(session) {
  const metadata = session.metadata || {};

  const leadId = metadata.leadId;
  const plan = metadata.plan;

  if (!leadId || !plan) {
    throw new Error("Missing Stripe metadata (leadId, plan)");
  }

  const customerId = session.customer || null;
  const email = session.customer_details?.email || null;

  const updatePayload = {
    paid: true,
    status: "active",
    plan,

    stripe_customer_id: customerId,
    customer_email: email,

    updated_at: new Date().toISOString(),
  };

  /* ===============================
     UPDATE LEAD
  =============================== */
  const { data, error } = await supabase
    .from("leads")
    .update(updatePayload)
    .eq("id", leadId)
    .select();

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  /* ===============================
     PAYMENT RECORD
  =============================== */
  await supabase.from("payments").upsert({
    id: session.id,
    lead_id: leadId,

    stripe_customer_id: customerId,
    customer_email: email,

    amount: (session.amount_total || 0) / 100,
    currency: session.currency || "usd",
    status: "paid",

    created_at: new Date().toISOString(),
  });

  /* ===============================
     TELEGRAM ALERT
  =============================== */
  sendTelegram(
    `💰 *PAYMENT SUCCESS*\n` +
      `Lead: ${leadId}\n` +
      `Plan: ${plan}\n` +
      `Amount: $${(session.amount_total || 0) / 100}`
  );
}

/* ===============================
   EVENT ROUTER (EXTENSIBLE)
=============================== */
async function processEvent(event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckout(event.data.object);
      break;

    case "customer.subscription.deleted":
      await sendTelegram("⚠️ Subscription cancelled");
      break;

    default:
      console.log("Unhandled Stripe event:", event.type);
  }
}

/* ===============================
   WEBHOOK ROUTE
=============================== */
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      const signature = req.headers["stripe-signature"];
      if (!signature) {
        return res.status(400).send("Missing Stripe signature");
      }

      /* ===============================
         VERIFY STRIPE SIGNATURE
      =============================== */
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        getEnv("STRIPE_WEBHOOK_SECRET")
      );

      /* ===============================
         IDEMPOTENCY CHECK
      =============================== */
      if (await isProcessed(event.id)) {
        return res.json({ received: true, duplicate: true });
      }

      await markEvent(event.id, {
        type: event.type,
        status: "processing",
      });

      /* ===============================
         PROCESS EVENT
      =============================== */
      await processEvent(event);

      await markEvent(event.id, {
        type: event.type,
        status: "completed",
        processed_at: new Date().toISOString(),
      });

      return res.json({ received: true });
    } catch (err) {
      console.error("Stripe webhook error:", err);

      if (event?.id) {
        await markEvent(event.id, {
          status: "failed",
          error: err.message,
          failed_at: new Date().toISOString(),
        });
      }

      sendTelegram(`❌ *WEBHOOK ERROR*\n${err.message}`);

      return res.status(500).json({
        success: false,
        error: "webhook_failed",
      });
    }
  }
);

module.exports = router;