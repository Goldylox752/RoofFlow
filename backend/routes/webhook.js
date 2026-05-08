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
    let event;

    try {
      const sig = req.headers["stripe-signature"];

      if (!sig) {
        return res.status(400).json({
          success: false,
          error: "Missing Stripe signature",
        });
      }

      /* ===============================
         VERIFY EVENT
      =============================== */
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log("[Stripe Webhook]", event.type);

      /* ===============================
         HANDLE SUCCESS PAYMENT
      =============================== */
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const leadId = session.metadata?.leadId;

        if (!leadId) {
          console.error("Missing leadId in metadata");
          return res.status(400).json({
            success: false,
            error: "Missing leadId",
          });
        }

        /* ===============================
           UPDATE SUPABASE LEAD
        =============================== */
        const { error } = await supabase
          .from("leads")
          .update({
            paid: true,
            status: "paid",
            activated_at: new Date().toISOString(),
          })
          .eq("id", leadId);

        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }
      }

      return res.json({ received: true });

    } catch (err) {
      console.error("Webhook error:", err);

      return res.status(500).json({
        success: false,
        error: "webhook_failed",
        message: err.message,
      });
    }
  }
);

module.exports = router;