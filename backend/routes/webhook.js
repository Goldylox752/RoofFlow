const express = require("express");
const router = express.Router();

const stripe = require("../lib/stripe");
const supabase = require("../lib/supabase");

/* ===============================
   SAFE SUPABASE WRAPPER
=============================== */
const db = {
  upsertUser: async (payload) => {
    const { error } = await supabase
      .from("users")
      .upsert(payload, { onConflict: "email" });

    if (error) throw error;
  },

  updateUserByCustomer: async (customerId, data) => {
    const { error } = await supabase
      .from("users")
      .update(data)
      .eq("stripe_customer_id", customerId);

    if (error) throw error;
  },
};

/* ===============================
   SAFE EMAIL EXTRACTOR
=============================== */
const getEmail = (session) => {
  return (
    session?.customer_details?.email ||
    session?.customer_email ||
    session?.metadata?.email ||
    null
  );
};

/* ===============================
   STRIPE WEBHOOK ROUTE
=============================== */
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: "Missing Stripe signature",
      });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);

      return res.status(400).json({
        success: false,
        error: "Invalid signature",
      });
    }

    const type = event.type;
    const data = event.data.object;

    try {
      /* ===============================
         CHECKOUT COMPLETED
      =============================== */
      if (type === "checkout.session.completed") {
        const email = getEmail(data);

        if (!email) return res.json({ received: true });

        const payload = {
          email: email.toLowerCase().trim(),
          name: data.metadata?.name || "Unknown",
          plan: data.metadata?.plan || "starter",
          status: "active",

          stripe_customer_id: data.customer,
          stripe_session_id: data.id,

          activated_at: new Date().toISOString(),
        };

        await db.upsertUser([payload]);

        console.log("User activated:", email);
      }

      /* ===============================
         SUBSCRIPTION CREATED / UPDATED
      =============================== */
      if (
        type === "customer.subscription.created" ||
        type === "customer.subscription.updated"
      ) {
        const plan =
          data?.items?.data?.[0]?.price?.nickname ||
          data?.items?.data?.[0]?.price?.id ||
          "starter";

        await db.updateUserByCustomer(data.customer, {
          plan,
          status: data.status === "active" ? "active" : "inactive",
          stripe_subscription_id: data.id,
        });

        console.log("Subscription synced:", data.customer);
      }

      /* ===============================
         SUBSCRIPTION CANCELED
      =============================== */
      if (type === "customer.subscription.deleted") {
        await db.updateUserByCustomer(data.customer, {
          status: "canceled",
          plan: "starter",
        });

        console.log("Subscription canceled:", data.customer);
      }

      /* ===============================
         PAYMENT FAILED
      =============================== */
      if (type === "invoice.payment_failed") {
        await db.updateUserByCustomer(data.customer, {
          status: "past_due",
        });

        console.log("Payment failed:", data.customer);
      }

      /* ===============================
         ACK STRIPE
      =============================== */
      return res.json({ received: true });
    } catch (err) {
      console.error("Webhook handler error:", err);

      return res.status(500).json({
        success: false,
        error: "Webhook processing failed",
      });
    }
  }
);

module.exports = router;