import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

// ===============================
// 🧼 VALIDATION
// ===============================
function validateJobInput(body: any) {
  const { lead_id, assigned_to } = body;

  if (!lead_id || !assigned_to) {
    return "Missing lead_id or assigned_to";
  }

  return null;
}

// ===============================
// 🔐 IDEMPOTENCY KEY
// ===============================
function buildJobKey(lead_id: string, assigned_to: string) {
  return `job:${lead_id}:${assigned_to}`;
}

// ===============================
// POST - CREATE JOB
// ===============================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { lead_id, assigned_to, status = "pending" } = body;

    // Validate
    const errorMsg = validateJobInput(body);
    if (errorMsg) {
      return Response.json({ error: errorMsg }, { status: 400 });
    }

    const jobKey = buildJobKey(lead_id, assigned_to);

    // Check existing job (idempotency)
    const { data: existing } = await supabaseServer
      .from("jobs")
      .select("id, lead_id, assigned_to, status")
      .eq("idempotency_key", jobKey)
      .maybeSingle();

    if (existing) {
      return Response.json({
        success: true,
        duplicate: true,
        job: existing,
      });
    }

    // Create job
    const { data, error } = await supabaseServer
      .from("jobs")
      .insert({
        lead_id,
        assigned_to,
        status,
        idempotency_key: jobKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      job: data,
    });
  } catch (err) {
    console.error("Job create error:", err);

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ===============================
// GET - LIST JOBS
// ===============================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    let query = supabaseServer
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      jobs: data || [],
      pagination: {
        limit,
        offset,
      },
    });
  } catch (err) {
    console.error("Job fetch error:", err);

    return Response.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}