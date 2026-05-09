const router = require("express").Router();
const Stripe = require("stripe");

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY
);

const prices = {
  starter:
    process.env.STRIPE_STARTER_PRICE_ID,

  growth:
    process.env.STRIPE_GROWTH_PRICE_ID,

  elite:
    process.env.STRIPE_ELITE_PRICE_ID,
};

router.post(
  "/checkout",
  async (req, res) => {
    try {
      const { plan } = req.body;

      const priceId =
        prices[plan];

      if (!priceId) {
        return res
          .status(400)
          .json({
            error:
              "Invalid plan",
          });
      }

      const session =
        await stripe.checkout.sessions.create(
          {
            mode: "payment",

            payment_method_types:
              ["card"],

            line_items: [
              {
                price: priceId,
                quantity: 1,
              },
            ],

            success_url: `${process.env.CLIENT_URL}/success`,

            cancel_url: `${process.env.CLIENT_URL}/cancel`,

            metadata: {
              plan,
            },
          }
        );

      res.json({
        url: session.url,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          err.message ||
          "Checkout failed",
      });
    }
  }
);

module.exports = router;