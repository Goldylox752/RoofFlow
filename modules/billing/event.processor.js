import { handleCheckoutCompleted } from "./handlers/checkout.completed.js";
import { handleSubscriptionUpdated } from "./handlers/subscription.updated.js";
import { handleSubscriptionDeleted } from "./handlers/subscription.deleted.js";
import { handleInvoicePaid } from "./handlers/invoice.paid.js";
import { logBillingEvent } from "./event.logger.js";
import { supabase } from "@/lib/supabase";

export async function processStripeEvent(event) {
  const eventId = event.id;
  const type = event.type;
  const payload = event.data?.object;

  try {
    /* ===============================
       IDEMPOTENCY CHECK
    =============================== */
    const { data: existing } = await supabase
      .from("billing_events")
      .select("stripe_event_id")
      .eq("stripe_event_id", eventId)
      .maybeSingle();

    if (existing) {
      console.log("Duplicate ignored:", eventId);
      return;
    }

    /* ===============================
       ROUTER
    =============================== */
    switch (type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(payload);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(payload);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(payload);
        break;

      case "invoice.paid":
        await handleInvoicePaid(payload);
        break;

      default:
        console.log("Unhandled event:", type);
    }

    await logBillingEvent(eventId, type, payload, "processed");
  } catch (err) {
    console.error("Event processing error:", err);

    await logBillingEvent(eventId, type, payload, "failed", err.message);

    throw err;
  }
}