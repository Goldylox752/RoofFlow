import {
  markLeadProcessing,
  markLeadDone,
  markLeadFailed,
} from "@/lib/queueLead";

import { aiScoreLead } from "@/lib/aiScoreLead";
import { supabase } from "@/lib/supabase";

// =====================
// CONFIG
// =====================
const BASE_CONCURRENCY = 5;
const MAX_CONCURRENCY = 12;
const MAX_RETRIES = 3;
const BATCH_SIZE = 20;

const WORKER_ID =
  process.env.WORKER_ID ||
  `worker_${Math.random().toString(36).slice(2, 10)}`;

// =====================
// UTILS
// =====================
const sleep = (ms) =>
  new Promise((r) => setTimeout(r, ms + Math.random() * 50));

// =====================
// ADAPTIVE CONCURRENCY
// =====================
async function getAdaptiveConcurrency() {
  const { data, error } = await supabase
    .from("lead_queue_metrics")
    .select("queue_depth, failed_rate")
    .single();

  if (error || !data) return BASE_CONCURRENCY;

  const depth = data.queue_depth || 0;
  const failedRate = data.failed_rate || 0;

  if (depth > 300 && failedRate < 0.1) return MAX_CONCURRENCY;
  if (depth > 150) return 8;
  if (depth < 30) return 3;

  return BASE_CONCURRENCY;
}

// =====================
// POISON CHECK
// =====================
function isPoisonLead(lead) {
  return lead.attempts >= MAX_RETRIES || lead.status === "failed_permanent";
}

// =====================
// CLAIM LEADS
// =====================
async function claimLeads() {
  try {
    const { data, error } = await supabase.rpc("claim_leads", {
      worker_id: WORKER_ID,
      batch_size: BATCH_SIZE,
    });

    if (error) {
      console.error("claimLeads RPC error:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("claimLeads crash:", err.message);
    return [];
  }
}

// =====================
// HEARTBEAT
// =====================
async function heartbeat(count = 0) {
  try {
    await supabase.from("worker_heartbeats").upsert({
      worker_id: WORKER_ID,
      last_seen: new Date().toISOString(),
      processed_count: count,
    });
  } catch (err) {
    console.error("heartbeat error:", err.message);
  }
}

// =====================
// PROCESS SINGLE LEAD
// =====================
async function processLead(lead) {
  if (!lead?.id) return { ok: false, reason: "invalid" };

  if (isPoisonLead(lead)) {
    await markLeadFailed(lead.id, "poison_lead", MAX_RETRIES, WORKER_ID);
    return { ok: false, id: lead.id, reason: "poison" };
  }

  try {
    const locked = await markLeadProcessing(lead.id, WORKER_ID);

    if (!locked) {
      return { ok: false, id: lead.id, reason: "locked" };
    }

    let scored = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        scored = await aiScoreLead(lead);
        if (scored) break;
      } catch (e) {
        if (attempt === 2) throw e;
        await sleep(100);
      }
    }

    if (!scored) {
      throw new Error("AI scoring returned null");
    }

    await markLeadDone(lead.id, scored, WORKER_ID);

    return { ok: true, id: lead.id };
  } catch (err) {
    console.error(`[${WORKER_ID}] lead failed`, lead.id, err.message);

    await markLeadFailed(
      lead.id,
      err.message,
      MAX_RETRIES,
      WORKER_ID
    );

    return { ok: false, id: lead.id };
  }
}

// =====================
// WORKER LOOP
// =====================
async function runWorker(leads, concurrency) {
  let index = 0;
  const results = [];

  async function workerLoop() {
    while (true) {
      const i = index++;
      if (i >= leads.length) break;

      const res = await processLead(leads[i]);
      results.push(res);

      await sleep(10);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, leads.length) },
    workerLoop
  );

  await Promise.all(workers);

  return results;
}

// =====================
// METRICS
// =====================
async function updateMetrics(results) {
  try {
    const total = results.length;
    const failed = results.filter((r) => !r.ok).length;

    await supabase.from("worker_metrics").insert({
      worker_id: WORKER_ID,
      total,
      failed,
      success: total - failed,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("metrics error:", err.message);
  }
}

// =====================
// ENTRYPOINT
// =====================
export async function GET() {
  const start = Date.now();

  try {
    const concurrency = await getAdaptiveConcurrency();
    const leads = await claimLeads();

    await heartbeat(0);

    if (!leads.length) {
      return Response.json({
        ok: true,
        worker: WORKER_ID,
        processed: 0,
        concurrency,
      });
    }

    console.log(
      `🚀 ${WORKER_ID} claimed ${leads.length} leads (concurrency=${concurrency})`
    );

    const results = await runWorker(leads, concurrency);

    await updateMetrics(results);
    await heartbeat(results.length);

    const processed = results.filter((r) => r.ok).length;
    const failed = results.length - processed;

    return Response.json({
      ok: true,
      worker: WORKER_ID,
      total: leads.length,
      processed,
      failed,
      concurrency,
      duration_ms: Date.now() - start,
    });
  } catch (err) {
    console.error("❌ worker crash:", err);

    await heartbeat(0);

    return Response.json(
      {
        ok: false,
        worker: WORKER_ID,
        error: "worker_failed",
      },
      { status: 500 }
    );
  }
}