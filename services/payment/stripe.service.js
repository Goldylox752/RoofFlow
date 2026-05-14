const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

/**
 * Creates checkout session for a lead purchase
 */
exports.createCheckoutSession = async ({ lead, userId }) => {
  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Lead: ${lead.city} - ${lead.category}`,
            description: `Score: ${lead.score}`,
          },
          unit_amount: lead.price * 100,
        },
        quantity: 1,
      },
    ],

    metadata: {
      leadId: String(lead.id),
      userId: String(userId),
    },

    success_url: `${process.env.CLIENT_URL}/success`,
    cancel_url: `${process.env.CLIENT_URL}/cancel`,
  });
};