const crypto = require("crypto");
const stripe = require("../../lib/stripe");
const supabase = require("../../lib/supabase");

/* ===============================
   PRICING (SERVER TRUSTED)
=============================== */
const PRICES = {
  starter: 1000,
  growth: 2000,
  elite: 5000,
};

/* ===============================
   GET STRIPE CUSTOMER
=============================== */
async function getStripeCustomer(authId) {
  const { data, error } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("auth_id", authId)
    .maybeSingle();

  if (error) throw error;

  if (!data?.stripe_customer_id) {
    throw new Error("Stripe customer not linked");
  }

  return data.stripe_customer_id;
}

/* ===============================
   CREATE CHECKOUT SESSION
=============================== */
async function createCheckoutSession({ user, plan = "starter" }) {
  try {
    if (!user?.id) throw new Error("Missing auth user");

    const amount = PRICES[plan];
    if (!amount) throw new Error("Invalid plan");

    const customerId = await getStripeCustomer(user.id);

    /* ===============================
       IDEMPOTENCY KEY
    =============================== */
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${user.id}:${plan}:${amount}`)
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
          auth_id: user.id,
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
      userId: user?.id,
      plan,
    });

    throw err;
  }
}

module.exports = {
  createCheckoutSession,
};