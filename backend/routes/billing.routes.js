const router = require("express").Router();
const auth = require("../../middleware/auth.middleware");
const { createCheckoutSession } = require("../../services/stripe/checkout.service");

/* ===============================
   ALLOWED PLANS
=============================== */
const ALLOWED_PLANS = ["starter", "growth", "elite"];

/* ===============================
   CREATE CHECKOUT SESSION
=============================== */
router.post("/checkout", auth, async (req, res) => {
  try {
    const { plan = "starter" } = req.body || {};

    /* ===============================
       VALIDATE PLAN EARLY
    =============================== */
    if (!ALLOWED_PLANS.includes(plan)) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan",
      });
    }

    /* ===============================
       STRICT USER CHECK
    =============================== */
    const user = req.user;

    if (!user?.id || !user?.email) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    /* ===============================
       CREATE STRIPE SESSION
    =============================== */
    const session = await createCheckoutSession({
      user: {
        id: user.id,
        email: user.email,
      },
      plan,
    });

    if (!session?.url) {
      return res.status(500).json({
        success: false,
        error: "Stripe session failed",
      });
    }

    return res.json({
      success: true,
      url: session.url,
    });
  } catch (err) {
    console.error("❌ Checkout error:", err);

    return res.status(500).json({
      success: false,
      error: "internal_server_error",
    });
  }
});

module.exports = router;