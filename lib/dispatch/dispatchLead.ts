import { supabase } from "@/lib/supabase";
import { pickContractor } from "./pickContractor";
import { calculateLeadPrice } from "../engines/pricing.engine";
import { leadQueue } from "../queues/lead.queue";

// ── Constants ────────────────────────────────────────────────────────────────

const DISPATCH_TIMEOUT_MS = 8000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Dispatch timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function fetchCityRow(city) {
  const { data } = await supabase
    .from("cities")
    .select("capacity, active_contractors, market")
    .eq("city", city)
    .single();

  return data || {
    capacity: 1,
    active_contractors: 0,
    market: city,
  };
}

async function logDispatchEvent(
  leadId,
  contractorId,
  price,
  success,
  reason
) {
  await supabase.from("dispatch_log").insert({
    lead_id: leadId,
    contractor_id: contractorId,
    final_price: price,
    success,
    reason: reason || null,
    logged_at: new Date().toISOString(),
  });
}

// ── Main Dispatch ────────────────────────────────────────────────────────────

export async function dispatchLead({
  lead,
  contractors,
  systemMetrics = {},
}) {
  // ── Validate ───────────────────────────────────────────────────────────────
  if (!lead || !lead.id) {
    return { success: false, reason: "Lead missing ID" };
  }

  if (!contractors || contractors.length === 0) {
    return {
      success: false,
      reason: "No contractors provided",
      leadId: lead.id,
    };
  }

  const city = lead.city || "global";

  try {
    // ── Pick contractor ──────────────────────────────────────────────────────
    const contractor = await withTimeout(
      pickContractor(city, contractors),
      DISPATCH_TIMEOUT_MS
    );

    if (!contractor || !contractor.id) {
      return {
        success: false,
        reason: "No eligible contractor found",
        leadId: lead.id,
      };
    }

    // ── Price lead ───────────────────────────────────────────────────────────
    const cityRow = await fetchCityRow(city);

    const pricing = calculateLeadPrice({
      lead: {
        id: lead.id,
        score: lead.score,
      },
      contractor: {
        id: contractor.id,
        plan: contractor.plan,
      },
      cityRow,
      systemMetrics: {
        demandMultiplier: systemMetrics.demandMultiplier || 1,
        surgeActive: systemMetrics.surgeActive || false,
      },
    });

    // ── Atomic update ────────────────────────────────────────────────────────
    const assignedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from("leads")
      .update({
        status: "assigned",
        assigned_contractor_id: contractor.id,
        assigned_at: assignedAt,
        final_price: pricing.finalPrice,
        price_breakdown: pricing.breakdown,
        tier: lead.tier || null,
        intent: lead.intent || null,
      })
      .eq("id", lead.id)
      .eq("status", "pending")
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        reason: error?.message || "Assignment failed or lead already taken",
        leadId: lead.id,
      };
    }

    // ── Increment contractor load ────────────────────────────────────────────
    await supabase.rpc("increment_contractor_load", {
      contractor_id: contractor.id,
    });

    // ── Optional logging ─────────────────────────────────────────────────────
    await logDispatchEvent(
      lead.id,
      contractor.id,
      pricing.finalPrice,
      true
    );

    // ── Done ─────────────────────────────────────────────────────────────────
    return {
      success: true,
      leadId: lead.id,
      contractorId: contractor.id,
      assignedAt,
      pricedAt: pricing.finalPrice,
      tier: lead.tier || "unknown",
      intent: lead.intent || "unknown",
    };
  } catch (err) {
    // ── Failure logging ──────────────────────────────────────────────────────
    await logDispatchEvent(
      lead?.id,
      null,
      0,
      false,
      err.message || "Dispatch failed"
    );

    return {
      success: false,
      reason: err.message || "Dispatch error",
      leadId: lead?.id,
    };
  }
}