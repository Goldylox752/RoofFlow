const router = require("express").Router();
const auth = require("../middleware/auth.middleware");

const {
  createCheckoutSession,
} = require("../services/stripe/checkout.service");

/* ===============================
   ALLOWED PLANS
=============================== */
const ALLOWED_PLANS = ["starter", "growth", "elite"];

/* ===============================
   CREATE CHECKOUT SESSION
=============================== */
router.post("/checkout", auth, async (req, res) => {
  try {
    const plan = req.body.plan || "starter";

    /* ===============================
       VALIDATE PLAN
    =============================== */
    if (!ALLOWED_PLANS.includes(plan)) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan",
      });
    }

    const session = await createCheckoutSession({
      user: req.user,
      plan,
    });

    return res.json({
      success: true,
      url: session.url,
    });

  } catch (err) {
    console.error("Checkout error:", err);

    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;