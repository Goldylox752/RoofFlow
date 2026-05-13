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
  const { error } = await supabase.from("stripe_events").upsert({
    id: eventId,
    ...payload,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

/* ===============================
   CORE: CHECKOUT SUCCESS
=============================== */
async function handleCheckout(session) {
  const leadId = session.metadata?.leadId;
  const plan = session.metadata?.plan;

  if (!leadId || !plan) {
    throw new Error("Missing Stripe metadata (leadId, plan)");
  }

  const update = {
    paid: true,
    status: "active",
    plan,
    stripe_customer_id: session.customer || null,
    customer_email: session.customer_details?.email || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("leads")
    .update(update)
    .eq("id", leadId)
    .select();

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  await supabase.from("payments").upsert({
    id: session.id,
    lead_id: leadId,
    stripe_customer_id: session.customer || null,
    customer_email: session.customer_details?.email || null,
    amount: (session.amount_total || 0) / 100,
    currency: session.currency || "usd",
    status: "paid",
    created_at: new Date().toISOString(),
  });

  sendTelegram(`Payment success\nLead: ${leadId}\nPlan: ${plan}`);
}

/* ===============================
   SUBSCRIPTION SYNC (NEW CORE)
=============================== */
async function syncSubscription(sub) {
  const customerId = sub.customer;

  const plan =
    sub.items?.data?.[0]?.price?.metadata?.plan || "starter";

  const status = sub.status;

  const update = {
    plan,
    status: mapStatus(status),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("users")
    .update(update)
    .eq("stripe_customer_id", customerId);

  if (error) throw error;
}

/* ===============================
   PAYMENT FAILURE
=============================== */
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;

  await supabase
    .from("users")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  sendTelegram(`Payment failed\nCustomer: ${customerId}`);
}

/* ===============================
   CANCEL
=============================== */
async function handleCancel(sub) {
  const customerId = sub.customer;

  await supabase
    .from("users")
    .update({
      status: "canceled",
      plan: "starter",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  sendTelegram(`Subscription canceled\nCustomer: ${customerId}`);
}

/* ===============================
   EVENT ROUTER
=============================== */
async function processEvent(event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckout(event.data.object);
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await syncSubscription(event.data.object);
      break;

    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;

    case "customer.subscription.deleted":
      await handleCancel(event.data.object);
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

      sendTelegram(`Webhook error\n${err.message}`);

      return res.status(500).json({
        success: false,
        error: "webhook_failed",
      });
    }
  }
);

module.exports = router;

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