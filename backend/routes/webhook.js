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
       HANDLE CHECKOUT SUCCESS
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
         UPSERT USER (REAL SAAS MODEL)
      =============================== */
      const { error } = await supabase
        .from("users")
        .upsert(
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
          {
            onConflict: "email",
          }
        );

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({
          success: false,
          error: "db_error",
        });
      }

      console.log("User activated:", cleanEmail);
    }

    return res.json({ received: true });
  }
);

module.exports = router;