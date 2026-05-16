import { supabase } from "@/lib/supabase";
import { pickContractor } from "./pickContractor";

export async function dispatchLead({
  lead,
  contractors,
  systemMetrics = {},
}: any) {
  if (!lead?.id) return null;

  const city = lead.city || "global";

  /* ===============================
     PICK BEST CONTRACTOR
  =============================== */
  const contractor = await pickContractor(city, contractors);

  if (!contractor?.id) return null;

  /* ===============================
     ATOMIC ASSIGNMENT
  =============================== */
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("leads")
    .update({
      status: "assigned",
      assigned_contractor_id: contractor.id,
      assigned_at: now,
    })
    .eq("id", lead.id)
    .eq("status", "pending")
    .select()
    .single();

  if (error || !data) return null;

  /* ===============================
     INCREMENT LOAD (SAFE)
  =============================== */
  await supabase.rpc("increment_contractor_load", {
    contractor_id: contractor.id,
  });

  return {
    lead: data,
    contractor,
  };
}