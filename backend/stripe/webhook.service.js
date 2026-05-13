async function handleStripeEvent(event) {
  const eventId = event.id;
  const type = event.type;

  try {
    /* ===============================
       IDEMPOTENCY CHECK (SAFE)
    =============================== */
    const { data: existing } = await supabase
      .from("billing_events")
      .select("id")
      .eq("stripe_event_id", eventId)
      .maybeSingle();

    if (existing) {
      console.log("⚠️ Duplicate event ignored:", eventId);
      return;
    }

    /* ===============================
       MAIN ROUTER
    =============================== */
    switch (type) {

      /* ===============================
         CHECKOUT COMPLETED
      =============================== */
      case "checkout.session.completed": {
        const session = event.data.object;

        const authId = session.metadata?.auth_id;
        const plan = session.metadata?.plan || "starter";
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (!authId) {
          console.error("Missing auth_id in session:", session.id);

          await supabase.from("billing_events").insert({
            stripe_event_id: eventId,
            type,
            payload: session,
            status: "failed_auth_missing",
            created_at: new Date().toISOString(),
          });

          return;
        }

        await supabase.from("subscriptions").upsert(
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
         SUBSCRIPTION CANCELED
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

      /* ===============================
         DEFAULT
      =============================== */
      default:
        console.log("Unhandled event:", type);
    }

    /* ===============================
       EVENT LOG (SUCCESS)
    =============================== */
    await supabase.from("billing_events").insert({
      stripe_event_id: eventId,
      type,
      payload: event.data.object,
      status: "processed",
      created_at: new Date().toISOString(),
    });

  } catch (err) {
    console.error("Webhook handler error:", err);

    /* ===============================
       EVENT LOG (FAILURE)
    =============================== */
    await supabase.from("billing_events").insert({
      stripe_event_id: eventId,
      type,
      payload: event.data?.object || null,
      status: "failed",
      error: err.message,
      created_at: new Date().toISOString(),
    });

    throw err;
  }
}