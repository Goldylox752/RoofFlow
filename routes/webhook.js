const express = require("express");
const router = express.Router();

const stripe = require("../lib/stripe");
const handleInvoicePaid = require("../services/stripe/handleInvoicePaid");

/* ===============================
   WEBHOOK ROUTE
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

      console.log("Stripe event:", event.type);

      /* ===============================
         INVOICE PAID HANDLER
      =============================== */
      if (event.type === "invoice.paid") {
        await handleInvoicePaid(event.data.object);
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