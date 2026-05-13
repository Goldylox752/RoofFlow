const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const https = require("https");

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
   SAFE TELEGRAM (NODE 14 SAFE)
=============================== */
const sendTelegram = (text) => {
  const token = process.env.TG_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  if (!token || !chatId) return;

  const payload = JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  });

  const options = {
    hostname: "api.telegram.org",
    path: `/bot${token}/sendMessage`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  const req = https.request(options);
  req.on("error", () => {});
  req.write(payload);
  req.end();
};

/* ===============================
   IDEMPOTENCY CHECK (SAFE)
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
   CHECKOUT HANDLER (HARDENED)
=============================== */
async function handleCheckout(session) {
  const leadId = session.metadata?.leadId;
  const plan = session.metadata?.plan;

  if (!leadId || !plan) throw new Error("Missing metadata");

  const update = {
    paid: true,
    status: "active",
    plan: plan.toLowerCase(),
    stripe_customer_id: session.customer || null,
    customer_email: session.customer_details?.email || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("leads")
    .update(update)
    .eq("id", leadId);

  if (error) throw error;

  await supabase.from("payments").upsert({
    id: session.id,
    lead_id: leadId,
    amount: (session.amount_total || 0) / 100,
    currency: session.currency || "usd",
    status: "paid",
    created_at: new Date().toISOString(),
  });

  sendTelegram(`Payment success\nLead: ${leadId}\nPlan: ${plan}`);
}

/* ===============================
   SUBSCRIPTION SYNC (ROBUST PLAN RESOLUTION)
=============================== */
async function syncSubscription(sub) {
  const customerId = sub.customer;

  const plan =
    sub.items?.data?.[0]?.price?.metadata?.plan ||
    sub.items?.data?.[0]?.price?.nickname ||
    "starter";

  const status = mapStatus(sub.status);

  await supabase
    .from("users")
    .update({
      plan: plan.toLowerCase(),
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);
}

/* ===============================
   PAYMENT FAILED
=============================== */
async function handlePaymentFailed(invoice) {
  await supabase
    .from("users")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", invoice.customer);

  sendTelegram(`Payment failed\nCustomer: ${invoice.customer}`);
}

/* ===============================
   CANCEL
=============================== */
async function handleCancel(sub) {
  await supabase
    .from("users")
    .update({
      status: "canceled",
      plan: "starter",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", sub.customer);

  sendTelegram(`Subscription canceled\nCustomer: ${sub.customer}`);
}

/* ===============================
   EVENT PROCESSOR
=============================== */
async function processEvent(event) {
  if (event.type === "checkout.session.completed") {
    return handleCheckout(event.data.object);
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    return syncSubscription(event.data.object);
  }

  if (event.type === "invoice.payment_failed") {
    return handlePaymentFailed(event.data.object);
  }

  if (event.type === "customer.subscription.deleted") {
    return handleCancel(event.data.object);
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
      if (!signature) return res.status(400).send("Missing signature");

      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        getEnv("STRIPE_WEBHOOK_SECRET")
      );

      if (await isProcessed(event.id)) {
        return res.json({ received: true, duplicate: true });
      }

      await markEvent(event.id, {
        type: event.type,
        status: "processing",
      });

      await processEvent(event);

      await markEvent(event.id, {
        status: "completed",
        processed_at: new Date().toISOString(),
      });

      return res.json({ received: true });
    } catch (err) {
      console.error("Webhook error:", err.message);

      if (event?.id) {
        await markEvent(event.id, {
          status: "failed",
          error: err.message,
        });
      }

      sendTelegram(`Webhook error\n${err.message}`);

      return res.status(500).json({
        success: false,
        error: "webhook_failed",
      });
    }
  }
);

/* ===============================
   HELPERS
=============================== */
function mapStatus(status) {
  const map = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    unpaid: "suspended",
    canceled: "canceled",
  };

  return map[status] || "unknown";
}

module.exports = router;