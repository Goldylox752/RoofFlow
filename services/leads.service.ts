import { supabase } from "@/lib/supabase";

/* ===============================
   CREATE LEAD
=============================== */
export async function createLead({
  name,
  email,
  phone,
  city,
  source = "web",
}) {
  if (!email && !phone) {
    throw new Error("Email or phone required");
  }

  const normalizedEmail = email ? email.trim().toLowerCase() : null;

  const { data: existing, error: fetchError } = await supabase
    .from("leads")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  if (existing && existing.id) {
    return { id: existing.id, duplicate: true };
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: name ? name.trim() : null,
      email: normalizedEmail,
      phone: phone ? phone.trim() : null,
      city: city ? city.trim() : null,
      source,
      status: "new",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}

/* ===============================
   GET SINGLE LEAD
=============================== */
export async function getLead(id) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/* ===============================
   LOCK LEAD
=============================== */
export async function lockLead(leadId, userId) {
  const { data, error } = await supabase
    .from("leads")
    .update({
      status: "locked",
      lock_owner: userId,
      locked_at: new Date().toISOString(),
      lock_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    .eq("id", leadId)
    .eq("status", "new")
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/* ===============================
   SELL LEAD
=============================== */
export async function sellLead(leadId, userId) {
  const { data, error } = await supabase
    .from("leads")
    .update({
      status: "sold",
      buyer_id: userId,
      stripe_paid: true,
      stripe_paid_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}