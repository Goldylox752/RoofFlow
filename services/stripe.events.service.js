const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ===============================
   STRIPE WEBHOOK HANDLER
   (AUTH-ID BASED + IDEMPOTENT)
=============================== */
async function handleEvent(event) {
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

      /* ===============================
         UPSERT SUBSCRIPTION (AUTH BASED)
      =============================== */
      const { error } = await supabase
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

      if (error) throw error;

      /* ===============================
         IDEMPOTENT EVENT LOG
      =============================== */
      await supabase.from("billing_events").upsert({
        stripe_event_id: event.id,
        type: "checkout.completed",
        auth_id: authId,
        payload: session,
      });

      break;
    }

    /* ===============================
       SUBSCRIPTION UPDATED
    =============================== */
    case "customer.subscription.updated": {
      const sub = event.data.object;

      await supabase
        .from("subscriptions")
        .update({
          status: sub.status,
          active: sub.status === "active",
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
}

module.exports = { handleEvent };