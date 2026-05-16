import { supabase } from "@/server/integrations/supabase";
import { scoreLead } from "@/server/engines/scoring.engine";
import { routeLead } from "@/server/engines/routing.engine";
import { calculateLeadPrice } from "@/server/engines/pricing.engine";

/* ===============================
   MAIN ORCHESTRATOR
=============================== */

export async function processLead(input: {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  source?: string;
  systemMetrics?: any;
}) {
  const startTime = Date.now();

  /* ===============================
     1. VALIDATION
  =============================== */
  if (!input.email && !input.phone) {
    throw new Error("Email or phone required");
  }

  const email = input.email?.trim().toLowerCase() || null;

  /* ===============================
     2. DEDUPE CHECK
  =============================== */
  const dedupeKey = `${email || ""}:${input.phone || ""}:${input.city || ""}`;

  const { data: existing } = await supabase
    .from("leads")
    .select("*")
    .eq("dedupe_key", dedupeKey)
    .maybeSingle();

  if (existing) {
    return {
      duplicate: true,
      lead: existing,
    };
  }

  /* ===============================
     3. SCORE LEAD
  =============================== */
  const score = scoreLead({
    email,
    phone: input.phone,
    city: input.city,
  });

  /* ===============================
     4. GET CONTRACTORS
  =============================== */
  const { data: contractors } = await supabase
    .from("contractors")
    .select("*")
    .eq("active", true);

  /* ===============================
     5. ROUTE CONTRACTOR
  =============================== */
  const contractor = routeLead({}, contractors || []);

  if (!contractor) {
    throw new Error("No available contractor");
  }

  /* ===============================
     6. GET CITY DATA
  =============================== */
  const { data: cityRow } = await supabase
    .from("cities")
    .select("*")
    .eq("name", input.city || "")
    .maybeSingle();

  /* ===============================
     7. PRICE CALCULATION
  =============================== */
  const price = calculateLeadPrice({
    lead: { score },
    contractor,
    cityRow,
    systemMetrics: input.systemMetrics || { demandMultiplier: 1 },
  });

  /* ===============================
     8. CREATE LEAD
  =============================== */
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      name: input.name,
      email,
      phone: input.phone,
      city: input.city || "unknown",

      score,
      price: price.finalPrice,

      status: "new",
      dedupe_key: dedupeKey,

      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !lead) {
    throw new Error("Lead creation failed");
  }

  /* ===============================
     9. ASSIGN CONTRACTOR
  =============================== */
  const { error: assignError } = await supabase
    .from("leads")
    .update({
      status: "assigned",
      assigned_contractor_id: contractor.id,
    })
    .eq("id", lead.id);

  if (assignError) {
    throw new Error("Assignment failed");
  }

  /* ===============================
     10. EVENT LOG
  =============================== */
  await supabase.from("events").insert({
    type: "lead_processed",
    lead_id: lead.id,
    payload: {
      score,
      contractorId: contractor.id,
      price: price.finalPrice,
    },
    created_at: new Date().toISOString(),
  });

  /* ===============================
     RESULT
  =============================== */

  return {
    lead,
    contractor,
    price: price.finalPrice,
    latency_ms: Date.now() - startTime,
  };
}