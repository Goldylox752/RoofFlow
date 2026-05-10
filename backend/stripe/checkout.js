const crypto = require("crypto");
const stripe = require("../../lib/stripe");
const supabase = require("../../lib/supabase");

/* ===============================
   PRICING (SERVER TRUTH ONLY)
=============================== */
const PRICES = Object.freeze({
  starter: 1000,
  growth: 2000,
  elite: 5000,
});

/* ===============================
   ENV CHECK
=============================== */
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_BASE_URL");
}

/* ===============================
   GET STRIPE CUSTOMER
=============================== */
async function getStripeCustomer(authId) {
  const { data, error } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("auth_id", authId)
    .single();

  if (error || !data?.stripe_customer_id) {
    throw new Error("Stripe customer not found");
  }

  return data.stripe_customer_id;
}

/* ===============================
   CHECKOUT HANDLER
=============================== */
async function checkout(req, res) {
  try {
    const { user, plan } = req.body;

    if (!user?.id) {
      return res.status(401).json({ error: "Missing user" });
    }

    const selectedPlan = plan || "starter";
    const amount = PRICES[selectedPlan];

    if (!amount) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const customerId = await getStripeCustomer(user.id);

    /* ===============================
       IDEMPOTENCY KEY
    =============================== */
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${user.id}:${selectedPlan}:${amount}`)
      .digest("hex");

    /* ===============================
       STRIPE SESSION
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
                name: `Flow OS — ${selectedPlan.toUpperCase()}`,
                description: "AI backend + automation system access",
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],

        metadata: {
          auth_id: user.id,
          plan: selectedPlan,
        },

        success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/cancel`,
      },
      {
        idempotencyKey,
      }
    );

    if (!session?.url) {
      return res.status(500).json({ error: "Stripe session failed" });
    }

    return res.status(200).json({
      url: session.url,
      id: session.id,
    });

  } catch (err) {
    console.error("❌ Checkout error:", err.message);

    return res.status(500).json({
      error: "Checkout failed",
    });
  }
}

module.exports = checkout;