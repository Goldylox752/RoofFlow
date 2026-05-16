import { supabase } from "@/lib/supabase";
import { dispatchLead } from "./dispatchLead";

const WORKER_ID =
  process.env.WORKER_ID ||
  `worker_${Math.random().toString(36).slice(2, 8)}`;

export async function runDispatcher(batchSize = 10) {
  const startedAt = Date.now();

  /* ===============================
     FETCH QUEUE (ONLY ONE SOURCE OF TRUTH)
  =============================== */
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .in("status", ["queued", "processing"])
    .limit(batchSize);

  if (!leads?.length) {
    return {
      worker: WORKER_ID,
      processed: 0,
      duration_ms: Date.now() - startedAt,
    };
  }

  /* ===============================
     CONTRACTORS
  =============================== */
  const { data: contractors } = await supabase
    .from("contractors")
    .select("*")
    .eq("active", true);

  let processed = 0;
  let failed = 0;

  for (const lead of leads) {
    try {
      const result = await dispatchLead({
        lead,
        contractors: contractors || [],
      });

      if (result) processed++;
    } catch (err: any) {
      failed++;

      console.error("Dispatch error:", {
        leadId: lead.id,
        error: err.message,
      });

      /* RECOVERY */
      await supabase
        .from("leads")
        .update({
          status: "queued",
          locked_by: null,
          locked_at: null,
        })
        .eq("id", lead.id);
    }
  }

  /* ===============================
     METRICS
  =============================== */
  await supabase.from("dispatcher_logs").insert({
    worker_id: WORKER_ID,
    processed,
    failed,
    batch_size: batchSize,
    duration_ms: Date.now() - startedAt,
    created_at: new Date().toISOString(),
  });

  return {
    worker: WORKER_ID,
    processed,
    failed,
  };
}