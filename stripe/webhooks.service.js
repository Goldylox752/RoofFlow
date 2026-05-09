const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ===============================
   SAFE EVENT HANDLER
=============================== */
async function handleEvent(event) {
  const eventId = event.id;

  /* ===============================
     IDEMPOTENCY CHECK (CRITICAL FIX)
  =============================== */
  const { data: existing } = await supabase
    .from("billing_events")
    .select("stripe_event_id")
    .eq("stripe_event_id", eventId)
    .maybeSingle();

  if (existing) {
    console.log("Duplicate event ignored:", eventId);
    return;
  }

  switch (event.type) {

    /* ===============================
       CHECKOUT COMPLETED
    =============================== */
    case "checkout.session.completed": {
      const session = event.data.object;

      const authId = session.metadata?.auth_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const plan = session.metadata?.plan || "unknown";

      if (!authId) {
        throw new Error("Missing auth_id in metadata");
      }

      await supabase
        .from("subscriptions")
        .upsert(
          {
            auth_id: authId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan,
            status: "active",
            active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "auth_id" }
        );

      await supabase.from("billing_events").insert({
        stripe_event_id: eventId,
        type: "checkout.completed",
        auth_id: authId,
        payload: session,
      });

      break;
    }

    /* ===============================
       SUBSCRIPTION UPDATED (FIXED STATES)
    =============================== */
    case "customer.subscription.updated": {
      const sub = event.data.object;

      const status =
        sub.status === "active"
          ? "active"
          : sub.status === "trialing"
          ? "trialing"
          : sub.status === "past_due"
          ? "past_due"
          : sub.status === "unpaid"
          ? "unpaid"
          : "canceled";

      await supabase
        .from("subscriptions")
        .update({
          status,
          active: status === "active" || status === "trialing",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", sub.customer);

      break;
    }

    /* ===============================
       SUBSCRIPTION DELETED
    =============================== */
    case "customer.subscription.deleted": {
      const sub = event.data.object;

      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", sub.customer);

      break;
    }

    default:
      console.log("Unhandled event:", event.type);
  }

  /* ===============================
     LOG EVENT AFTER PROCESSING
  =============================== */
  await supabase.from("billing_events").insert({
    stripe_event_id: eventId,
    type: event.type,
    payload: event.data.object,
  });
}

module.exports = { handleEvent };