const express = require("express");
const router = express.Router();

const stripe = require("../lib/stripe");
const supabase = require("../lib/supabase");

/* ===============================
   STRIPE WEBHOOK
=============================== */
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return res.status(400).json({
        success: false,
        error: "Missing Stripe signature",
      });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Invalid webhook signature:", err.message);
      return res.status(400).json({
        success: false,
        error: "Invalid signature",
      });
    }

    console.log("Stripe event:", event.type);

    /* ===============================
       1. CHECKOUT SUCCESS (NEW USER)
    =============================== */
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const email =
        session.customer_details?.email ||
        session.customer_email ||
        session.metadata?.email;

      const name = session.metadata?.name || "Unknown";
      const plan = session.metadata?.plan || "starter";

      if (!email) return res.json({ received: true });

      const cleanEmail = email.toLowerCase().trim();

      await supabase.from("users").upsert(
        [
          {
            email: cleanEmail,
            name,
            plan,
            status: "active",

            stripe_customer_id: session.customer,
            stripe_session_id: session.id,

            activated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "email" }
      );

      console.log("User activated:", cleanEmail);
    }

    /* ===============================
       2. SUBSCRIPTION CREATED / UPDATED
    =============================== */
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const sub = event.data.object;

      const customerId = sub.customer;
      const status = sub.status;

      const plan =
        sub.items?.data?.[0]?.price?.nickname ||
        sub.items?.data?.[0]?.price?.id ||
        "starter";

      await supabase
        .from("users")
        .update({
          plan,
          status: status === "active" ? "active" : "inactive",
          stripe_subscription_id: sub.id,
        })
        .eq("stripe_customer_id", customerId);

      console.log("Subscription synced:", customerId);
    }

    /* ===============================
       3. SUBSCRIPTION CANCELED
    =============================== */
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;

      await supabase
        .from("users")
        .update({
          status: "canceled",
          plan: "starter",
        })
        .eq("stripe_customer_id", sub.customer);

      console.log("Subscription canceled:", sub.customer);
    }

    /* ===============================
       4. PAYMENT FAILED
    =============================== */
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;

      await supabase
        .from("users")
        .update({
          status: "past_due",
        })
        .eq("stripe_customer_id", invoice.customer);

      console.log("Payment failed:", invoice.customer);
    }

    /* ===============================
       ALWAYS ACKNOWLEDGE STRIPE
    =============================== */
    return res.json({ received: true });
  }
);

module.exports = router;