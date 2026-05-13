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
   TELEGRAM (NON-BLOCKING)
=============================== */

const sendTelegram = async (text) => {
  const token = process.env.TG_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  if (!token || !chatId) return;

  fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
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
   IDEMPOTENCY HELPERS
=============================== */

async function isProcessed(eventId) {
  const { data } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

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
   CORE BUSINESS LOGIC
=============================== */

async function handleCheckout(session) {
  const metadata = session.metadata || {};

  if (!metadata.leadId || !metadata.plan) {
    throw new Error("Missing Stripe metadata: leadId or plan");
  }

  const leadId = String(metadata.leadId);
  const plan = String(metadata.plan);

  const updatePayload = {
    paid: true,
    status: "active",
    plan,

    stripe_customer_id: session.customer || null,
    customer_email: session.customer_details?.email || null,

    updated_at: new Date().toISOString(),
  };

  /* ===============================
     UPDATE LEAD (SAFE CHECK)
  =============================== */

  const { data, error } = await supabase
    .from("leads")
    .update(updatePayload)
    .eq("id", leadId)
    .select();

  if (error) throw error;

  if (!data || data.length === 0) {
    throw new Error("Lead not found for update");
  }

  /* ===============================
     PAYMENT RECORD
  =============================== */

  await supabase.from("payments").upsert(
    {
      id: session.id,
      lead_id: leadId,

      stripe_customer_id: session.customer || null,
      customer_email: session.customer_details?.email || null,

      amount: (session.amount_total || 0) / 100,
      currency: session.currency || "usd",
      status: "paid",

      created_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  /* ===============================
     TELEGRAM (NON-BLOCKING)
  =============================== */

  sendTelegram(
    `💰 *PAYMENT SUCCESS*\n\n` +
      `Lead: ${leadId}\n` +
      `Plan: ${plan}\n` +
      `Amount: $${(session.amount_total || 0) / 100}`
  );
}

/* ===============================
   EVENT ROUTER
=============================== */

async function processEvent(event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckout(event.data.object);
      break;

    default:
      console.log("Unhandled event:", event.type);
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
        return res.status(400).send("Missing signature");
      }

      /* ===============================
         VERIFY STRIPE EVENT
      =============================== */

      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        getEnv("STRIPE_WEBHOOK_SECRET")
      );

      console.log("Stripe event:", event.type);

      /* ===============================
         IDEMPOTENCY CHECK (STRICT)
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
      console.error("Webhook error:", err);

      if (event?.id) {
        await markEvent(event.id, {
          status: "failed",
          error: err.message,
          failed_at: new Date().toISOString(),
        });
      }

      sendTelegram(
        `❌ *STRIPE WEBHOOK ERROR*\n\n${err.message}`
      );

      return res.status(500).json({
        success: false,
        error: "webhook_failed",
      });
    }
  }
);

module.exports = router;