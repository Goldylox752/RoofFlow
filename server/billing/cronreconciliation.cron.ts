


import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===============================
// 🔐 SAFE LOGGER
// ===============================
function log(msg, data) {
  console.log(`[reconcile] ${msg}`, data || "");
}

// ===============================
// 🔁 SYNC SUBSCRIPTIONS (RESUMABLE + SAFE)
// ===============================
async function syncSubscriptions() {
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const res = await stripe.subscriptions.list({
      limit: 100,
      status: "all",
      starting_after: startingAfter || undefined,
    });

    for (const sub of res.data) {
      try {
        const customerId = sub.customer;

        const { data: contractor } = await supabase
          .from("contractors")
          .select("id, active, stripe_subscription_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!contractor) continue;

        const shouldBeActive =
          sub.status === "active" || sub.status === "trialing";

        // 🔐 skip if already correct state
        if (
          contractor.active === shouldBeActive &&
          contractor.stripe_subscription_id === sub.id
        ) {
          continue;
        }

        const { error } = await supabase
          .from("contractors")
          .update({
            active: shouldBeActive,
            stripe_subscription_id: sub.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", contractor.id);

        if (error) {
          log("subscription update failed", error.message);
          continue;
        }

        log("reconciled contractor", {
          id: contractor.id,
          active: shouldBeActive,
        });

      } catch (err) {
        log("subscription item error", err.message);
      }
    }

    hasMore = res.has_more;
    startingAfter = res.data.at(-1)?.id;
  }
}

// ===============================
// 💳 SYNC CHECKOUTS (SAFE + IDEMPOTENT)
// ===============================
async function syncRecentCheckouts() {
  const sessions = await stripe.checkout.sessions.list({
    limit: 100,
  });

  for (const session of sessions.data) {
    try {
      if (session.payment_status !== "paid") continue;

      const email = session.customer_details?.email;
      if (!email) continue;

      // 🔐 idempotency guard (prevents duplicate inserts)
      const { data: existing } = await supabase
        .from("contractors")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) continue;

      const { error } = await supabase.from("contractors").insert({
        email,
        stripe_customer_id: session.customer,
        active: true,
        plan: "pro",
        created_at: new Date().toISOString(),
      });

      if (error) {
        log("checkout recovery failed", error.message);
        continue;
      }

      log("recovered contractor", email);

    } catch (err) {
      log("checkout item error", err.message);
    }
  }
}

// ===============================
// 🧹 EVENT DRIFT CHECK (NON-BLOCKING)
// ===============================
async function reconcileEvents() {
  const { data: failedEvents } = await supabase
    .from("stripe_events")
    .select("id, type")
    .eq("status", "failed")
    .limit(50);

  for (const event of failedEvents || []) {
    try {
      log("event retry candidate", event.id);

      // future: requeue system hook
    } catch (err) {
      log("event retry error", err.message);
    }
  }
}

// ===============================
// 🧠 MAIN JOB
// ===============================
export async function GET(req) {
  const isCron = req.headers.get("x-vercel-cron");

  if (!isCron) {
    return new Response("Unauthorized", { status: 401 });
  }

  const start = Date.now();

  try {
    log("job started");

    // run sequentially (prevents Stripe + Supabase overload)
    await syncSubscriptions();
    await syncRecentCheckouts();
    await reconcileEvents();

    const duration = Date.now() - start;

    log("job complete", `${duration}ms`);

    return Response.json({
      ok: true,
      duration_ms: duration,
    });

  } catch (err) {
    console.error("❌ reconciliation crash:", err);

    return Response.json(
      { ok: false, error: "reconciliation_failed" },
      { status: 500 }
    );
  }
}