import { supabase } from "@/lib/supabase";
import { calculatePrice } from "@/lib/pricingEngine";
import { routeLead } from "@/lib/routingEngine";

/* ===============================
   HELPERS
=============================== */

function buildDedupeKey(email, phone, city) {
  const identity = email || phone || "anonymous";
  const location = (city || "global").toLowerCase().trim();
  return `${identity}:${location}`;
}

function calculateScore(email, phone, city) {
  let score = 3;

  if (email) score += 2;
  if (phone) score += 3;
  if (city) score += 1;

  if (email && phone && city) score += 1;

  return Math.min(10, score);
}

async function logEvent(type, payload = {}) {
  try {
    await supabase.from("events").insert({
      type,
      payload,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Event log failed:", err?.message);
  }
}

/* ===============================
   MAIN HANDLER
=============================== */

export async function POST(req) {
  const startTime = Date.now();

  try {
    const { email, phone, name, city, source = "direct" } = await req.json();

    /* ===============================
       VALIDATION
    =============================== */

    if (!email && !phone) {
      return Response.json(
        { success: false, error: "Email or phone required" },
        { status: 400 }
      );
    }

    const dedupeKey = buildDedupeKey(email, phone, city);
    const score = calculateScore(email, phone, city);

    /* ===============================
       DUPLICATE CHECK
    =============================== */

    const { data: existing } = await supabase
      .from("leads")
      .select("id, status, assigned_contractor_id")
      .eq("dedupe_key", dedupeKey)
      .maybeSingle();

    if (existing) {
      return Response.json({
        success: true,
        duplicate: true,
        lead: existing,
      });
    }

    /* ===============================
       CREATE LEAD (INITIAL STATE)
    =============================== */

    const basePrice = calculatePrice(score, "basic");

    const { data: lead, error: insertError } = await supabase
      .from("leads")
      .insert({
        email,
        phone,
        name,
        city: city || "unknown",
        source,

        dedupe_key: dedupeKey,
        score,
        price: basePrice,

        status: "new",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !lead) {
      await logEvent("lead_create_failed", { error: insertError?.message });

      return Response.json(
        { success: false, error: "Lead creation failed" },
        { status: 500 }
      );
    }

    await logEvent("lead_created", {
      leadId: lead.id,
      score,
      city,
    });

    /* ===============================
       ROUTING ENGINE
    =============================== */

    let assignment;
    try {
      assignment = await routeLead(lead);
    } catch (err) {
      await logEvent("routing_error", {
        leadId: lead.id,
        error: err?.message,
      });

      assignment = null;
    }

    /* ===============================
       UNROUTED HANDLING
    =============================== */

    if (!assignment?.contractorId) {
      await logEvent("lead_unassigned", {
        leadId: lead.id,
      });

      return Response.json({
        success: true,
        routed: false,
        lead,
      });
    }

    /* ===============================
       FINAL PRICE (POST ROUTING)
    =============================== */

    const finalPrice = calculatePrice(score, assignment.cityTier || "basic");

    /* ===============================
       ATOMIC ASSIGNMENT (RACE SAFE)
    =============================== */

    const { data: updated } = await supabase
      .from("leads")
      .update({
        status: "assigned",

        assigned_contractor_id: assignment.contractorId,

        lock_owner: assignment.contractorId,
        locked_at: new Date().toISOString(),

        price: finalPrice,
      })
      .eq("id", lead.id)
      .eq("status", "new")
      .select()
      .maybeSingle();

    if (!updated) {
      await logEvent("lead_race_condition", { leadId: lead.id });

      return Response.json(
        { success: false, error: "LEAD_ALREADY_CLAIMED" },
        { status: 409 }
      );
    }

    /* ===============================
       FINAL EVENT
    =============================== */

    await logEvent("lead_assigned", {
      leadId: lead.id,
      contractorId: assignment.contractorId,
      price: finalPrice,
      score,
    });

    /* ===============================
       RESPONSE
    =============================== */

    return Response.json({
      success: true,
      routed: true,
      lead: updated,
      assignment,
      latency_ms: Date.now() - startTime,
    });

  } catch (err) {
    console.error("Lead engine crash:", err);

    await logEvent("lead_engine_crash", {
      error: err?.message,
    });

    return Response.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}