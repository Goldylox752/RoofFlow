const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const https = require("https");
const logger = require("../lib/logger");

/* ===============================
   ENV
=============================== */
function env(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env: ${key}`);
  return val;
}

/* ===============================
   CLIENTS
=============================== */
const stripe = new Stripe(env("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-06-20",
  maxNetworkRetries: 3,
});

const supabase = createClient(
  env("SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY")
);

/* ===============================
   TELEGRAM (FIRE-AND-FORGET)
=============================== */
function notifyTelegram(message) {
  const token = process.env.TG_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  if (!token || !chatId) return;

  const payload = JSON.stringify({
    chat_id: chatId,
    text: message,
  });

  const req = https.request(
    {
      hostname: "api.telegram.org",
      path: `/bot${token}/sendMessage`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  req.on("error", (err) =>
    logger.error("telegram_error", err)
  );

  req.write(payload);
  req.end();
}

/* ===============================
   IDEMPOTENCY STORE
=============================== */
async function eventExists(eventId) {
  const { data, error } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    logger.error("event_check_failed", error);
    return false;
  }

  return !!data;
}

async function saveEvent(eventId, data) {
  const { error } = await supabase
    .from("stripe_events")
    .upsert({
      id: eventId,
      ...data,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    logger.error("event_save_failed", error);
  }
}

/* ===============================
   LEAD PAYMENT FINALIZATION
=============================== */
async function markLeadAsPaid(
  leadId,
  session
) {
  const { data, error } = await supabase
    .from("leads")
    .update({
      paid: true,
      status: "sold",
      stripe_customer_id:
        session.customer || null,
      customer_email:
        session.customer_details?.email ||
        null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/* ===============================
   PAYMENT RECORD
=============================== */
async function upsertPayment(
  session,
  leadId
) {
  const { error } = await supabase
    .from("payments")
    .upsert({
      id: session.id,
      lead_id: leadId,
      amount:
        (session.amount_total || 0) / 100,
      currency: session.currency || "usd",
      status: "paid",
      created_at: new Date().toISOString(),
    });

  if (error) throw error;
}

/* ===============================
   CHECKOUT HANDLER
=============================== */
async function handleCheckoutCompleted(
  session
) {
  const leadId = session.metadata?.leadId;
  const plan = session.metadata?.plan || "starter";

  if (!leadId) {
    throw new Error("Missing leadId");
  }

  logger.info("checkout_completed", {
    leadId,
    plan,
  });

  const lead = await markLeadAsPaid(
    leadId,
    session
  );

  await upsertPayment(session, leadId);

  notifyTelegram(
    `💰 PAYMENT SUCCESS\nLead: ${leadId}\nCity: ${
      lead.city || "N/A"
    }`
  );
}

/* ===============================
   SUBSCRIPTION SYNC
=============================== */
async function syncSubscription(sub) {
  const customerId = sub.customer;

  const plan =
    sub.items?.data?.[0]?.price?.metadata
      ?.plan ||
    sub.items?.data?.[0]?.price?.nickname ||
    "starter";

  const status = mapStripeStatus(sub.status);

  const { error } = await supabase
    .from("users")
    .update({
      plan: plan.toLowerCase(),
      status,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    logger.error("subscription_sync_failed", {
      customerId,
      error,
    });
  }

  logger.info("subscription_synced", {
    customerId,
    plan,
    status,
  });
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

  notifyTelegram(
    `⚠️ PAYMENT FAILED\nCustomer: ${customerId}`
  );
}

/* ===============================
   SUBSCRIPTION CANCELLED
=============================== */
async function handleSubscriptionCancelled(
  sub
) {
  const customerId = sub.customer;

  await supabase
    .from("users")
    .update({
      status: "canceled",
      plan: "starter",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  notifyTelegram(
    `❌ SUBSCRIPTION CANCELED\nCustomer: ${customerId}`
  );
}

/* ===============================
   EVENT ROUTER
=============================== */
async function handleEvent(event) {
  logger.info("stripe_event", {
    type: event.type,
    id: event.id,
  });

  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(
        event.data.object
      );

    case "customer.subscription.created":
    case "customer.subscription.updated":
      return syncSubscription(
        event.data.object
      );

    case "customer.subscription.deleted":
      return handleSubscriptionCancelled(
        event.data.object
      );

    case "invoice.payment_failed":
      return handlePaymentFailed(
        event.data.object
      );

    default:
      logger.warn("unhandled_event", {
        type: event.type,
      });
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
      const signature =
        req.headers["stripe-signature"];

      if (!signature) {
        return res
          .status(400)
          .send("Missing signature");
      }

      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        env("STRIPE_WEBHOOK_SECRET")
      );

      /* ===========================
         IDEMPOTENCY GUARD
      =========================== */
      if (await eventExists(event.id)) {
        return res.json({
          received: true,
          duplicate: true,
        });
      }

      await saveEvent(event.id, {
        type: event.type,
        status: "processing",
      });

      await handleEvent(event);

      await saveEvent(event.id, {
        status: "completed",
        processed_at:
          new Date().toISOString(),
      });

      return res.json({ received: true });
    } catch (err) {
      logger.error("stripe_webhook_failed", {
        message: err.message,
        eventId: event?.id,
      });

      if (event?.id) {
        await saveEvent(event.id, {
          status: "failed",
          error: err.message,
        });
      }

      notifyTelegram(
        `🔥 WEBHOOK ERROR\n${err.message}`
      );

      return res.status(500).json({
        success: false,
        error: "webhook_failed",
      });
    }
  }
);

/* ===============================
   STATUS MAPPER
=============================== */
function mapStripeStatus(status) {
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