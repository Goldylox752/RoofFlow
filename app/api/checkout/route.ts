import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const plan = body?.plan || "default";

    const baseUrl = process.env.NEXT_PUBLIC_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { success: false, error: "Missing NEXT_PUBLIC_URL" },
        { status: 500 }
      );
    }

    /* ===============================
       PRICE SELECTION (READY FOR SCALE)
    =============================== */
    const PRICE_MAP: Record<string, string | undefined> = {
      default: process.env.STRIPE_PRICE_ID,
      pro: process.env.STRIPE_PRICE_PRO_ID,
      elite: process.env.STRIPE_PRICE_ELITE_ID,
    };

    const priceId = PRICE_MAP[plan];

    if (!priceId) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing price ID" },
        { status: 400 }
      );
    }

    /* ===============================
       CREATE CHECKOUT SESSION
    =============================== */
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      payment_method_types: ["card"],

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      success_url: `${baseUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?canceled=true`,

      metadata: {
        plan,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { success: false, error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    /* ===============================
       RESPONSE
    =============================== */
    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      plan,
    });
  } catch (err: any) {
    console.error("Checkout error:", err);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}