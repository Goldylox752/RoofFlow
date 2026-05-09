const express = require("express");
const router = express.Router();

const stripe = require("../lib/stripe");
const supabase = require("../lib/supabase");

/* ===============================
   STRIPE WEBHOOK (RAW BODY REQUIRED)
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
         VERIFY STRIPE EVENT
      =============================== */
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log("Stripe event:", event.type);

      /* ===============================
         HANDLE PAYMENT SUCCESS
      =============================== */
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const email =
          session.customer_details?.email ||
          session.customer_email ||
          session.metadata?.email;

        const name = session.metadata?.name || "Unknown";
        const plan = session.metadata?.plan || "starter";

        if (!email) {
          console.error("Missing email in session");
          return res.status(400).json({
            success: false,
            error: "Missing email",
          });
        }

        const cleanEmail = email.toLowerCase().trim();

        /* ===============================
           UPSERT USER (SAFE PATTERN)
        =============================== */
        const { error } = await supabase
          .from("leads")
          .upsert(
            [
              {
                email: cleanEmail,
                name,
                plan,
                paid: true,
                status: "paid",
                activated_at: new Date().toISOString(),
                stripe_session_id: session.id,
              },
            ],
            {
              onConflict: "email",
            }
          );

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        console.log("User activated:", cleanEmail);
      }

      /* ===============================
         ALWAYS ACKNOWLEDGE STRIPE
      =============================== */
      return res.json({ received: true });

    } catch (err) {
      console.error("Webhook failed:", err);

      return res.status(400).json({
        success: false,
        error: "webhook_failed",
        message: err.message,
      });
    }
  }
);

module.exports = router;