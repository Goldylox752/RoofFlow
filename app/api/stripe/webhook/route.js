import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   ENV GUARD
========================= */
function env(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env: ${key}`);
  return val;
}

/* =========================
   HELPERS
========================= */
const now = () => new Date().toISOString();

/* =========================
   HANDLERS
========================= */

async function handleCheckoutCompleted(session) {
  const leadId = session.metadata?.leadId;

  if (!leadId) throw new Error("Missing leadId in metadata");

  // mark lead sold
  await supabase
    .from("leads")
    .update({
      paid: true,
      status: "sold",
      stripe_customer_id: session.customer ?? null,
      customer_email: session.customer_details?.email ?? null,
      updated_at: now(),
    })
    .eq("id", leadId);

  // upsert payment record (idempotent-safe)
  await supabase
    .from("payments")
    .upsert({
      id: session.id,
      lead_id: leadId,
      amount: (session.amount_total ?? 0) / 100,
      currency: session.currency ?? "usd",
      status: "paid",
      created_at: now(),
    });
}

async function handleInvoiceFailed(invoice) {
  await supabase
    .from("users")
    .update({
      status: "past_due",
      updated_at: now(),
    })
    .eq("stripe_customer_id", invoice.customer);
}

async function handleSubscriptionDeleted(sub) {
  await supabase
    .from("users")
    .update({
      status: "canceled",
      plan: "starter",
      updated_at: now(),
    })
    .eq("stripe_customer_id", sub.customer);
}

async function handleSubscriptionChange(sub) {
  const plan =
    sub.items?.data?.[0]?.price?.metadata?.plan ||
    sub.items?.data?.[0]?.price?.nickname ||
    "starter";

  const statusMap = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    unpaid: "suspended",
    canceled: "canceled",
  };

  await supabase
    .from("users")
    .update({
      plan: String(plan).toLowerCase(),
      status: statusMap[sub.status] ?? "unknown",
      stripe_customer_id: sub.customer,
      updated_at: now(),
    })
    .eq("stripe_customer_id", sub.customer);
}

/* =========================
   WEBHOOK ENTRYPOINT
========================= */
export async function POST(req) {
  try {
    const signature = req.headers.get("stripe-signature");
    const rawBody = await req.text();

    if (!signature) {
      return new Response("Missing Stripe signature", { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env("STRIPE_WEBHOOK_SECRET")
    );

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object);
        break;

      default:
        console.log("Unhandled Stripe event:", event.type);
    }

    return Response.json({ received: true });

  } catch (err) {
    console.error("Stripe webhook error:", err);

    return new Response(
      JSON.stringify({
        success: false,
        error: "webhook_failed",
      }),
      { status: 500 }
    );
  }
}