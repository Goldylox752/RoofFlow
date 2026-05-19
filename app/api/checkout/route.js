import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const BASE_URL = process.env.CLIENT_URL?.trim();

if (!BASE_URL) {
  console.error("Missing CLIENT_URL environment variable");
}

/* ===============================
   PRICING (SERVER TRUTH)
=============================== */

const PRICES = {
  starter: { amount: 1000, name: "Starter" },
  growth: { amount: 2000, name: "Growth" },
  elite: { amount: 5000, name: "Elite" },
};

/* ===============================
   HELPERS
=============================== */

const clean = (v) =>
  typeof v === "string" ? v.trim().toLowerCase() : "starter";

/* ===============================
   ROUTE
=============================== */

export async function POST(req) {
  try {
    const body = await req.json();

    const plan = clean(body.plan);
    const userId = body.userId;

    if (!userId) {
      return Response.json(
        { success: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const pricing = PRICES[plan];

    if (!pricing) {
      return Response.json(
        { success: false, error: "invalid_plan" },
        { status: 400 }
      );
    }

    // ===============================
    // OPTIONAL: fetch user from Supabase (if needed later)
    // ===============================
    // const { data: user } = await supabase
    //   .from("users")
    //   .select("stripe_customer_id")
    //   .eq("auth_id", userId)
    //   .single();

    // ===============================
    // CREATE CHECKOUT SESSION
    // ===============================

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      payment_method_types: ["card"],

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pricing.amount,
            product_data: {
              name: `RoofFlow — ${plan}`,
              description: "AI Roofing Pipeline Platform",
            },
          },
        },
      ],

      metadata: {
        userId,
        plan,
        amount: String(pricing.amount),
      },

      success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/cancel`,
    });

    if (!session?.url) {
      throw new Error("Stripe session creation failed");
    }

    return Response.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("[checkout error]", err);

    return Response.json(
      {
        success: false,
        error: err.message || "checkout_failed",
      },
      { status: 500 }
    );
  }
}