import { supabase } from "@/lib/supabase";

// =====================
// GET ALL LEADS
// =====================
export async function getLeads(limit = 50) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// =====================
// GET SINGLE LEAD
// =====================
export async function getLead(id) {
  if (!id) throw new Error("Lead ID required");

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// =====================
// CREATE LEAD
// =====================
export async function createLead(payload) {
  if (!payload?.email && !payload?.phone) {
    throw new Error("Email or phone required");
  }

  const dedupeKey = `${payload.email || ""}:${payload.phone || ""}:${payload.city || ""}`;

  // check duplicate
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("dedupe_key", dedupeKey)
    .maybeSingle();

  if (existing?.id) {
    return { id: existing.id, duplicate: true };
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: payload.name || null,
      email: payload.email?.trim()?.toLowerCase() || null,
      phone: payload.phone || null,
      city: payload.city || null,

      score: payload.score ?? null,
      status: "new",

      dedupe_key: dedupeKey,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// =====================
// UPDATE LEAD STATUS
// =====================
export async function updateLead(id, updates = {}) {
  if (!id) throw new Error("Lead ID required");

  const { data, error } = await supabase
    .from("leads")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// =====================
// ASSIGN CONTRACTOR
// =====================
export async function assignContractor(leadId, contractorId) {
  if (!leadId || !contractorId) {
    throw new Error("Missing leadId or contractorId");
  }

  const { data, error } = await supabase
    .from("leads")
    .update({
      status: "assigned",
      assigned_contractor_id: contractorId,
      assigned_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// =====================
// DELETE LEAD (optional admin use)
// =====================
export async function deleteLead(id) {
  if (!id) throw new Error("Lead ID required");

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}