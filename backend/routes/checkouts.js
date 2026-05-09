const router = require("express").Router();
const stripe = require("../lib/stripe");

const PRICES = {
  starter: 9900,
  growth: 19900,
  elite: 49900,
};

router.post("/checkout", async (req, res) => {
  try {
    const { email, plan } = req.body;

    // =====================
    // VALIDATION
    // =====================
    if (!email || !plan) {
      return res.status(400).json({
        success: false,
        error: "Email and plan are required",
      });
    }

    const amount = PRICES[plan];

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan",
      });
    }

    // =====================
    // STRIPE SESSION
    // =====================
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email.toLowerCase().trim(),

      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `RoofFlow AI - ${plan}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    return res.json({
      success: true,
      url: session.url,
    });

  } catch (err) {
    console.error("Checkout error:", err);

    return res.status(500).json({
      success: false,
      error: "Checkout failed",
    });
  }
});

module.exports = router;