const stripe = require("./stripe");

const PRICES = {
  starter: 9900,
  growth: 19900,
  elite: 49900,
};

async function createCheckoutSession({ email, plan }) {
  const amount = PRICES[plan];

  if (!amount) throw new Error("Invalid plan");

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

  return session;
}

module.exports = {
  createCheckoutSession,
};