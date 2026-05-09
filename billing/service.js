const router = require("express").Router();
const stripe = require("../lib/stripe");
const supabase = require("../lib/supabase");

/* ===============================
   CREATE BILLING PORTAL SESSION
=============================== */
router.post("/create-portal", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Missing email",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Get Stripe customer from DB
    const { data, error } = await supabase
      .from("leads")
      .select("stripe_customer_id")
      .eq("email", cleanEmail)
      .single();

    if (error || !data?.stripe_customer_id) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,

      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    return res.json({
      success: true,
      url: session.url,
    });

  } catch (err) {
    console.error("Portal error:", err);

    return res.status(500).json({
      success: false,
      error: err.message || "portal_failed",
    });
  }
});

/* ===============================
   GET CUSTOMER INFO
=============================== */
router.get("/customer", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Missing email",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("email", cleanEmail)
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      customer: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* ===============================
   CANCEL SUBSCRIPTION (future-safe)
=============================== */
router.post("/cancel-subscription", async (req, res) => {
  try {
    const { email } = req.body;

    const cleanEmail = email.toLowerCase().trim();

    const { data, error } = await supabase
      .from("leads")
      .select("stripe_customer_id")
      .eq("email", cleanEmail)
      .single();

    if (error || !data?.stripe_customer_id) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // NOTE: This assumes subscription exists (you may expand later)
    const subscriptions = await stripe.subscriptions.list({
      customer: data.stripe_customer_id,
      limit: 1,
    });

    if (!subscriptions.data.length) {
      return res.status(400).json({
        success: false,
        error: "No active subscription",
      });
    }

    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });

    await supabase
      .from("leads")
      .update({
        status: "canceled",
      })
      .eq("email", cleanEmail);

    return res.json({
      success: true,
      message: "Subscription will cancel at period end",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;