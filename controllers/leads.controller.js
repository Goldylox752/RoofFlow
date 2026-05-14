const supabase = require("../lib/supabase");

/* ===============================
   SAFE RESPONSES
=============================== */
const success = (res, data) =>
  res.status(200).json({ success: true, data });

const fail = (res, message, code = 500) =>
  res.status(code).json({ success: false, error: message });

/* ===============================
   SIMPLE LEAD SCORING ENGINE
=============================== */
function calculateScore({ email, phone, city }) {
  let score = 40;

  if (email?.includes("@gmail")) score += 5;
  if (phone) score += 20;
  if (city) score += 10;

  return Math.min(score, 100);
}

/* ===============================
   CREATE LEAD (UPGRADED SAAS VERSION)
=============================== */
exports.createLead = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      city,
      category = "general",
      source = "api",
      tenant_id = null,
    } = req.body;

    /* ===============================
       VALIDATION
    =============================== */
    if (!email && !phone) {
      return fail(res, "Email or phone required", 400);
    }

    if (!category) {
      return fail(res, "Category required", 400);
    }

    /* ===============================
       NORMALIZE
    =============================== */
    const normalizedEmail = email?.toLowerCase().trim() || null;
    const normalizedPhone = phone?.trim() || null;

    /* ===============================
       DEDUPE KEY (CRITICAL FOR MARKETPLACE)
    =============================== */
    const dedupeKey = `${normalizedEmail || ""}-${normalizedPhone || ""}`;

    /* ===============================
       CHECK DUPLICATES
    =============================== */
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("dedupe_key", dedupeKey)
      .maybeSingle();

    if (existing) {
      return fail(res, "Duplicate lead blocked", 409);
    }

    /* ===============================
       SCORE ENGINE
    =============================== */
    const score = calculateScore({
      email: normalizedEmail,
      phone: normalizedPhone,
      city,
    });

    /* ===============================
       FINAL LEAD OBJECT
    =============================== */
    const lead = {
      name: name?.trim() || "Unknown",
      email: normalizedEmail,
      phone: normalizedPhone,
      city: city?.trim() || null,

      category,
      source,
      tenant_id,

      score,
      status: "new",

      dedupe_key: dedupeKey,

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    /* ===============================
       INSERT LEAD
    =============================== */
    const { data, error } = await supabase
      .from("leads")
      .insert([lead])
      .select()
      .single();

    if (error) {
      return fail(res, error.message);
    }

    /* ===============================
       EVENT TRACKING (FOR SAAS ANALYTICS)
    =============================== */
    await supabase.from("lead_events").insert([
      {
        lead_id: data.id,
        type: "created",
        source,
        meta: { category, score },
        created_at: new Date().toISOString(),
      },
    ]);

    return success(res, data);
  } catch (err) {
    console.error("Create lead error:", err);
    return fail(res, "Internal server error");
  }
};