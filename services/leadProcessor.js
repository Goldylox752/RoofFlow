const supabase = require("../lib/supabase");

/* ===============================
   CREATE LEAD (SAFE + DEDUPED)
=============================== */
async function createLead({
  name,
  email,
  phone,
  city,
  source = "web",
}) {
  if (!email) throw new Error("Email required");

  const cleanEmail = email.trim().toLowerCase();

  /* ===============================
     CHECK DUPLICATES FIRST
  =============================== */
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (existing) {
    return {
      message: "Lead already exists",
      id: existing.id,
    };
  }

  /* ===============================
     NORMALIZED PAYLOAD
  =============================== */
  const payload = {
    name: name?.trim() || null,
    email: cleanEmail,
    phone: phone?.trim() || null,
    city: city?.trim() || null,
    source,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("leads")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", {
      message: error.message,
      code: error.code,
    });

    throw new Error("Failed to create lead");
  }

  return data;
}