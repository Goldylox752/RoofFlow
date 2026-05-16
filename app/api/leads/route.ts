import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

import { supabase } from "@/lib/supabase";
import { calculatePrice } from "@/lib/pricingEngine";
import { routeLead } from "@/lib/routingEngine";

/* ===============================
   VALIDATION
=============================== */
const schema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  source: z.string().optional(),
});

/* ===============================
   HELPERS
=============================== */

function dedupeKey(email?: string, phone?: string, city?: string) {
  const id = email || phone || crypto.randomUUID();
  const loc = (city || "global").toLowerCase().trim();
  return `${id}:${loc}`;
}

function scoreLead(email?: string, phone?: string, city?: string) {
  let score = 3;
  if (email) score += 2;
  if (phone) score += 3;
  if (city) score += 1;
  if (email && phone && city) score += 1;
  return Math.min(10, score);
}

async function logEvent(type: string, payload: any = {}) {
  await supabase.from("events").insert({
    type,
    payload,
    created_at: new Date().toISOString(),
  });
}

/* ===============================
   GET LEADS
=============================== */
export async function GET() {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: "fetch_failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    leads: data,
  });
}

/* ===============================
   CREATE / ROUTE LEAD (MAIN ENGINE)
=============================== */
export async function POST(req: Request) {
  const start = Date.now();

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "invalid_input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, phone, name, city, source = "direct" } = parsed.data;

    /* ===============================
       VALIDATION RULE
    =============================== */
    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: "email_or_phone_required" },
        { status: 400 }
      );
    }

    const key = dedupeKey(email, phone, city);
    const score = scoreLead(email, phone, city);

    /* ===============================
       DUPLICATE CHECK
    =============================== */
    const { data: existing } = await supabase
      .from("leads")
      .select("*")
      .eq("dedupe_key", key)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        lead: existing,
      });
    }

    /* ===============================
       CREATE LEAD
    =============================== */
    const basePrice = calculatePrice(score, "basic");

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        email,
        phone,
        name,
        city: city || "unknown",
        source,

        dedupe_key: key,
        score,
        price: basePrice,
        status: "new",

        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !lead) {
      await logEvent("lead_create_failed", { error: error?.message });

      return NextResponse.json(
        { success: false, error: "create_failed" },
        { status: 500 }
      );
    }

    await logEvent("lead_created", { leadId: lead.id, score });

    /* ===============================
       ROUTING ENGINE (UPGRADED)
    =============================== */
    let assignment = null;

    try {
      assignment = await routeLead(lead);
    } catch (err: any) {
      await logEvent("routing_error", { leadId: lead.id, error: err?.message });
    }

    if (!assignment?.contractorId) {
      return NextResponse.json({
        success: true,
        routed: false,
        lead,
      });
    }

    /* ===============================
       FINAL PRICE AFTER ROUTING
    =============================== */
    const finalPrice = calculatePrice(score, assignment.cityTier || "basic");

    /* ===============================
       ATOMIC UPDATE (SAFE ASSIGNMENT)
    =============================== */
    const { data: updated } = await supabase
      .from("leads")
      .update({
        status: "assigned",
        assigned_contractor_id: assignment.contractorId,
        price: finalPrice,
        locked_at: new Date().toISOString(),
      })
      .eq("id", lead.id)
      .eq("status", "new")
      .select()
      .maybeSingle();

    if (!updated) {
      await logEvent("lead_race_condition", { leadId: lead.id });

      return NextResponse.json(
        { success: false, error: "already_claimed" },
        { status: 409 }
      );
    }

    await logEvent("lead_assigned", {
      leadId: lead.id,
      contractorId: assignment.contractorId,
      price: finalPrice,
    });

    /* ===============================
       RESPONSE
    =============================== */
    return NextResponse.json({
      success: true,
      routed: true,
      lead: updated,
      assignment,
      latency_ms: Date.now() - start,
    });

  } catch (err: any) {
    await logEvent("lead_engine_crash", { error: err?.message });

    return NextResponse.json(
      { success: false, error: "internal_error" },
      { status: 500 }
    );
  }
}