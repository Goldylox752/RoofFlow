import { supabase } from "@/lib/supabase/client";

export async function logBillingEvent(
  eventId: string,
  type: string,
  payload: any,
  status: "processed" | "failed",
  error?: string
) {
  await supabase.from("billing_events").insert({
    stripe_event_id: eventId,
    type,
    payload,
    status,
    error: error || null,
    created_at: new Date().toISOString(),
  });
}