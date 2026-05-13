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
  if (!email) throw new Error("Email is required");

  const cleanEmail = email.trim().toLowerCase();

  /* ===============================
     DUPLICATE CHECK (SAFE READ)
  =============================== */
  const { data: existing, error: fetchError } = await supabase
    .from("leads")
    .select("id")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (fetchError) {
    console.error("Supabase fetch error:", fetchError);
    throw new Error("Failed to check existing leads");
  }

  if (existing?.id) {
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

  /* ===============================
     INSERT LEAD
  =============================== */
  const { data, error } = await supabase
    .from("leads")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    throw new Error("Failed to create lead");
  }

  return data;
}

module.exports = { createLead };