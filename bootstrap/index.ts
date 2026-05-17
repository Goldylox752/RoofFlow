import { bootstrapQueue } from "./queue.bootstrap";
import { bootstrapMetering } from "./metering.bootstrap";
import { bootstrapCallCenter } from "./callcenter.bootstrap";
import { bootstrapEvents } from "./events.bootstrap";
import { bootstrapStripe } from "./stripe.bootstrap";
import { bootstrapTelegram } from "./telegram.bootstrap";
import { bootstrapExpress } from "./express.bootstrap";
import { bootstrapCron } from "./cron.bootstrap";

/* ===============================
   SYSTEM STATE REGISTRY
=============================== */
const systemState: Record<string, any> = {};

/* ===============================
   RETRY ENGINE
=============================== */
async function withRetry(
  name: string,
  fn: () => Promise<any>,
  retries = 3,
  critical = false
) {
  for (let i = 1; i <= retries; i++) {
    try {
      await fn();
      systemState[name] = { status: "ready", attempts: i };
      console.log(`[bootstrap] ${name} ready (attempt ${i})`);
      return;
    } catch (err) {
      console.error(`[bootstrap] ${name} failed attempt ${i}`, err);

      if (i === retries) {
        systemState[name] = { status: "failed", error: err };

        if (critical) {
          throw new Error(`[bootstrap] CRITICAL SERVICE FAILED: ${name}`);
        }
      }
    }
  }
}

/* ===============================
   READINESS GATE
=============================== */
function assertReady(required: string[]) {
  const missing = required.filter(
    (k) => systemState[k]?.status !== "ready"
  );

  if (missing.length > 0) {
    throw new Error(
      `[bootstrap] system not ready. Missing: ${missing.join(", ")}`
    );
  }
}

/* ===============================
   BOOTSTRAP CORE
=============================== */
export async function bootstrapApp(app: any) {
  console.log("[bootstrap] HARD MODE STARTING");

  /* ===============================
     1. FOUNDATION (CRITICAL)
  =============================== */
  await withRetry("queue", bootstrapQueue, 5, true);

  /* ===============================
     2. CORE ENGINE (CRITICAL)
  =============================== */
  await Promise.all([
    withRetry("metering", bootstrapMetering, 3, true),
    withRetry("call-center", bootstrapCallCenter, 3, true),
  ]);

  assertReady(["queue", "metering", "call-center"]);

  /* ===============================
     3. EVENT LAYER (IMPORTANT)
  =============================== */
  await withRetry("events", bootstrapEvents, 3, false);

  /* ===============================
     4. EXTERNAL SYSTEMS (IMPORTANT)
  =============================== */
  await Promise.all([
    withRetry("stripe", bootstrapStripe, 3, true),
    withRetry("telegram", bootstrapTelegram, 3, false),
  ]);

  assertReady(["stripe"]);

  /* ===============================
     5. API LAYER (DEPENDENT ON CORE)
  =============================== */
  await withRetry("express", () => bootstrapExpress(app), 2, true);

  /* ===============================
     6. BACKGROUND SYSTEMS
  =============================== */
  await withRetry("cron", bootstrapCron, 2, false);

  /* ===============================
     FINAL READINESS CHECK
  =============================== */
  assertReady(["queue", "metering", "call-center", "stripe", "express"]);

  console.log("[bootstrap] SYSTEM FULLY OPERATIONAL");
  console.log(systemState);
}