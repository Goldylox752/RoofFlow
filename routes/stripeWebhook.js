const express = require("express");
const Stripe = require("stripe");

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ===============================
   STRIPE WEBHOOK ROUTE
   - RAW BODY REQUIRED
   - SIGNATURE VERIFIED
   - SAFE FOR REPLAY ATTACKS (idempotency recommended)
=============================== */
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return res.status(400).json({
        success: false,
        error: "missing_signature",
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
      console.error("Stripe webhook signature error:", err.message);

      return res.status(400).json({
        success: false,
        error: "invalid_signature",
      });
    }

    try {
      const eventType = event.type;
      const data = event.data.object;

      switch (eventType) {
        /*
          PAYMENT SUCCESS FLOW
          - unlock lead
          - assign contractor
          - mark payment complete
        */
        case "payment_intent.succeeded": {
          const { leadId, contractorId } = data.metadata || {};

          if (!leadId || !contractorId) {
            console.warn("Missing metadata on payment_intent:", data.id);
            break;
          }

          // TODO:
          // 1. mark payment as paid in DB
          // 2. assign lead to contractor
          // 3. unlock lead workflow

          console.log("Payment succeeded for lead:", {
            leadId,
            contractorId,
          });

          break;
        }

        default:
          console.log("Unhandled Stripe event:", eventType);
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("Stripe webhook processing error:", err);

      return res.status(500).json({
        success: false,
        error: "webhook_processing_failed",
      });
    }
  }
);

module.exports = router;