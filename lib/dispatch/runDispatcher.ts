import { supabase } from "@/lib/supabase";
import { dispatchLead } from "./dispatchLead";

const WORKER_ID =
  process.env.WORKER_ID ||
  `worker_${Math.random().toString(36).slice(2, 10)}`;

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/* =========================================================
   RECOVER STALE LOCKS
========================================================= */
async function recoverStaleLeads() {
  const staleTime = new Date(
    Date.now() - LOCK_TIMEOUT_MS
  ).toISOString();

  const { error } = await supabase
    .from("leads")
    .update({
      status: "queued",
      locked_by: null,
      locked_at: null,
    })
    .eq("status", "processing")
    .lt("locked_at", staleTime);

  if (error) {
    console.error("Failed to recover stale leads:", error);
  }
}

/* =========================================================
   CLAIM LEADS
   Requires SQL RPC:
   claim_leads(worker TEXT, batch_count INT)
========================================================= */
async function claimLeads(batchSize: number) {
  const { data, error } = await supabase.rpc(
    "claim_leads",
    {
      worker: WORKER_ID,
      batch_count: batchSize,
    }
  );

  if (error) {
    console.error("Failed to claim leads:", error);
    return [];
  }

  return data || [];
}

/* =========================================================
   FETCH CONTRACTORS
========================================================= */
async function fetchContractors() {
  const { data, error } = await supabase
    .from("contractors")
    .select("*")
    .eq("active", true);

  if (error) {
    console.error("Failed to fetch contractors:", error);
    return [];
  }

  return data || [];
}

/* =========================================================
   GROUP CONTRACTORS BY CITY
========================================================= */
function groupContractorsByCity(contractors: any[]) {
  return contractors.reduce((acc, contractor) => {
    const city = contractor.city || "unknown";

    if (!acc[city]) {
      acc[city] = [];
    }

    acc[city].push(contractor);

    return acc;
  }, {} as Record<string, any[]>);
}

/* =========================================================
   COMPLETE LEAD
========================================================= */
async function markLeadAssigned(
  leadId: string,
  contractorId: string
) {
  await supabase
    .from("leads")
    .update({
      status: "assigned",
      assigned_contractor_id: contractorId,
      assigned_at: new Date().toISOString(),
      locked_by: null,
      locked_at: null,
    })
    .eq("id", leadId);
}

/* =========================================================
   FAIL LEAD
========================================================= */
async function markLeadFailed(
  leadId: string,
  reason?: string
) {
  await supabase
    .from("leads")
    .update({
      status: "queued",
      locked_by: null,
      locked_at: null,
      last_error: reason || null,
      retry_count: supabase.rpc("increment_retry_count"),
    })
    .eq("id", leadId);
}

/* =========================================================
   MAIN DISPATCHER
========================================================= */
export async function runDispatcher(
  batchSize = 10
) {
  const startedAt = Date.now();

  /* -----------------------------------------
     RECOVER DEAD LOCKS
  ----------------------------------------- */
  await recoverStaleLeads();

  /* -----------------------------------------
     CLAIM LEADS ATOMICALLY
  ----------------------------------------- */
  const leads = await claimLeads(batchSize);

  if (!leads.length) {
    return {
      worker: WORKER_ID,
      processed: 0,
      failed: 0,
      duration_ms: Date.now() - startedAt,
    };
  }

  /* -----------------------------------------
     CONTRACTOR POOLS
  ----------------------------------------- */
  const contractors = await fetchContractors();

  const contractorMap =
    groupContractorsByCity(contractors);

  let processed = 0;
  let failed = 0;

  /* -----------------------------------------
     PROCESS LEADS
  ----------------------------------------- */
  for (const lead of leads) {
    try {
      const cityContractors =
        contractorMap[lead.city] || [];

      if (!cityContractors.length) {
        throw new Error(
          `No contractors available in ${lead.city}`
        );
      }

      const result = await dispatchLead({
        lead,
        contractors: cityContractors,
      });

      if (!result?.contractor?.id) {
        throw new Error("Dispatch failed");
      }

      await markLeadAssigned(
        lead.id,
        result.contractor.id
      );

      processed++;
    } catch (err: any) {
      failed++;

      console.error("Dispatch error:", {
        worker: WORKER_ID,
        leadId: lead.id,
        error: err.message,
      });

      await markLeadFailed(
        lead.id,
        err.message
      );
    }
  }

  /* -----------------------------------------
     METRICS
  ----------------------------------------- */
  await supabase
    .from("dispatcher_logs")
    .insert({
      worker_id: WORKER_ID,
      processed,
      failed,
      batch_size: batchSize,
      duration_ms:
        Date.now() - startedAt,
      created_at: new Date().toISOString(),
    });

  return {
    worker: WORKER_ID,
    processed,
    failed,
    duration_ms:
      Date.now() - startedAt,
  };
}