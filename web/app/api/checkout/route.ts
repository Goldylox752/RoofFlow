import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: "Plan is required",
        },
        { status: 400 }
      );
    }

    // TODO:
    // Replace this with Stripe Checkout later
    // Example:
    // const session = await stripe.checkout.sessions.create(...)

    return NextResponse.json({
      success: true,
      plan,
      url: "/dashboard",
    });
  } catch (error) {
    console.error("Checkout route error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create checkout session",
      },
      { status: 500 }
    );
  }
}