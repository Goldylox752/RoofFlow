const crypto = require("crypto");
const stripe = require("../lib/stripe");
const { getOrCreateStripeCustomer } = require("../services/stripe/customer.service");

/* ===============================
   PRICING (SERVER-TRUSTED)
=============================== */
const PRICES = {
  starter: 1000,
  growth: 2000,
  elite: 5000,
};

/* ===============================
   CREATE CHECKOUT SESSION (AUTH-BASED)
=============================== */
async function createCheckoutSession({ authId, plan = "starter" }) {
  try {
    if (!authId) throw new Error("Missing auth_id");

    const amount = PRICES[plan];
    if (!amount) throw new Error("Invalid plan");

    /* ===============================
       RESOLVE STRIPE CUSTOMER (NO DB DUPLICATION)
    =============================== */
    const customerId = await getOrCreateStripeCustomer({
      id: authId,
    });

    /* ===============================
       IDEMPOTENCY KEY
    =============================== */
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${authId}:${plan}:${amount}`)
      .digest("hex");

    /* ===============================
       CREATE STRIPE SESSION
    =============================== */
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",

        customer: customerId,

        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Flow OS - ${plan.toUpperCase()}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],

        metadata: {
          auth_id: authId,
          plan,
        },

        success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      },
      {
        idempotencyKey,
      }
    );

    if (!session?.url) {
      throw new Error("Stripe did not return checkout URL");
    }

    return {
      url: session.url,
      id: session.id,
    };

  } catch (err) {
    console.error("❌ Checkout Error:", {
      message: err.message,
      authId,
      plan,
    });

    throw err;
  }
}

module.exports = {
  createCheckoutSession,
};