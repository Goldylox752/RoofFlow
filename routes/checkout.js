const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const billing = require("../middleware/billing.middleware");

const { createCheckoutSession } = require("../lib/checkout");

/* ===============================
   CHECKOUT (PROTECTED)
=============================== */
router.post(
  "/checkout",
  auth,
  async (req, res) => {
    try {
      const user = req.user;

      const session = await createCheckoutSession({
        plan: req.body.plan,
        email: user.email,
        customerId: user.stripe_customer_id,
      });

      return res.json({
        success: true,
        url: session.url,
      });

    } catch (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
);

module.exports = router;