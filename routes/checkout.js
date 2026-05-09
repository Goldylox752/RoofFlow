const router = require("express").Router();
const { createCheckoutSession } = require("../lib/checkout");

router.post("/checkout", async (req, res) => {
  try {
    const session = await createCheckoutSession(req.body);

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