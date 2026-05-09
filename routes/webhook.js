const express = require("express");
const router = express.Router();

const stripe = require("../lib/stripe");

const handleInvoicePaid = require("../services/stripe/handleInvoicePaid");
const handleCheckoutCompleted = require("../services/stripe/handleCheckoutCompleted");
const handleSubscriptionUpdated = require("../services/stripe/handleSubscriptionUpdated");

/* ===============================
   WEBHOOK ROUTE (PRODUCTION SAFE)
=============================== */
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      const sig = req.headers["stripe-signature"];

      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log("[Stripe Event]", event.type);

      /* ===============================
         EVENT ROUTER
      =============================== */
      switch (event.type) {

        case "checkout.session.completed":
          await handleCheckoutCompleted(event.data.object);
          break;

        case "invoice.paid":
          await handleInvoicePaid(event.data.object);
          break;

        case "customer.subscription.updated":
          await handleSubscriptionUpdated(event.data.object);
          break;

        case "customer.subscription.deleted":
          await handleSubscriptionUpdated(event.data.object);
          break;

        default:
          console.log("Unhandled event:", event.type);
      }

      return res.json({ received: true });

    } catch (err) {
      console.error("Webhook error:", err);

      return res.status(400).json({
        success: false,
        error: "webhook_failed",
        message: err.message,
      });
    }
  }
);

module.exports = router;