const supabase = require("../lib/supabase");

/* ===============================
   RESPONSE HELPERS
=============================== */
const success = (res, data) =>
  res.status(200).json({ success: true, data });

const fail = (res, message, code = 500) =>
  res.status(code).json({ success: false, error: message });

/* ===============================
   UTILS
=============================== */
function nowISO() {
  return new Date().toISOString();
}

function addMinutes(min) {
  return new Date(Date.now() + min * 60 * 1000).toISOString();
}

/* ===============================
   SCORING ENGINE (SIMPLE + EXTENDABLE)
=============================== */
function calculateScore({ email, phone, city }) {
  let score = 40;

  if (email?.includes("@gmail")) score += 5;
  if (phone) score += 20;
  if (city) score += 10;

  return Math.min(score, 100);
}

/* ===============================
   CREATE LEAD (SAAS ENGINE)
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

    /* ---------- VALIDATION ---------- */
    if (!email && !phone) return fail(res, "Email or phone required", 400);
    if (!category) return fail(res, "Category required", 400);

    /* ---------- NORMALIZE ---------- */
    const normalizedEmail = email?.toLowerCase().trim() || null;
    const normalizedPhone = phone?.trim() || null;

    const dedupeKey = `${normalizedEmail || ""}-${normalizedPhone || ""}`;

    /* ---------- DUPLICATE CHECK ---------- */
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("dedupe_key", dedupeKey)
      .maybeSingle();

    if (existing) {
      return fail(res, "Duplicate lead blocked", 409);
    }

    /* ---------- SCORE ---------- */
    const score = calculateScore({
      email: normalizedEmail,
      phone: normalizedPhone,
      city,
    });

    /* ---------- LEAD OBJECT ---------- */
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

      created_at: nowISO(),
      updated_at: nowISO(),
    };

    /* ---------- INSERT ---------- */
    const { data, error } = await supabase
      .from("leads")
      .insert([lead])
      .select()
      .single();

    if (error) return fail(res, error.message);

    /* ---------- EVENT TRACKING ---------- */
    await supabase.from("lead_events").insert({
      lead_id: data.id,
      type: "created",
      source,
      meta: { category, score },
      created_at: nowISO(),
    });

    return success(res, data);
  } catch (err) {
    console.error("Create lead error:", err);
    return fail(res, "Internal server error");
  }
};

/* ===============================
   CLAIM LEAD (ATOMIC SAAS LOCK)
=============================== */
exports.claimLead = async (req, res) => {
  const startedAt = Date.now();

  try {
    const { leadId, contractorId } = req.body;

    if (!leadId || !contractorId) {
      return fail(res, "Missing leadId or contractorId", 400);
    }

    const now = nowISO();
    const expiresAt = addMinutes(5);

    /* ---------- ATOMIC CLAIM ---------- */
    const { data: lead, error } = await supabase
      .from("leads")
      .update({
        status: "assigned",
        assigned_contractor_id: contractorId,

        lock_owner: contractorId,
        locked_at: now,
        lock_expires_at: expiresAt,
      })
      .eq("id", leadId)
      .or(`status.eq.new,and(status.eq.assigned,lock_expires_at.lt.${now})`)
      .select()
      .maybeSingle();

    if (error || !lead) {
      return res.status(409).json({
        success: false,
        error: "LEAD_ALREADY_CLAIMED",
      });
    }

    /* ---------- EVENT LOG (ASYNC SAFE) ---------- */
    supabase.from("events").insert({
      lead_id: leadId,
      type: "lead_claimed",
      payload: {
        contractorId,
        locked_at: now,
        expires_at: expiresAt,
      },
    }).catch(() => {});

    return res.json({
      success: true,
      lead,
      lockedBy: contractorId,
      expiresAt,
      latency_ms: Date.now() - startedAt,
    });

  } catch (err) {
    console.error("Lead claim error:", err);

    return fail(res, "INTERNAL_SERVER_ERROR");
  }
};