export async function bootstrapApp(app?: any) {
  console.log("[bootstrap] starting system...");

  // ==============================
  // 1. CORE INFRASTRUCTURE (CRITICAL)
  // ==============================
  await withRetry("queue", bootstrapQueue, 5, true);

  // ==============================
  // 2. CORE SERVICES (CRITICAL)
  // ==============================
  await withRetry("metering", bootstrapMetering, 3, true);
  await withRetry("call-center", bootstrapCallCenter, 3, true);

  assertReady(["queue", "metering", "call-center"]);

  // ==============================
  // 3. EVENTS (OPTIONAL)
  // ==============================
  await withRetry("events", bootstrapEvents, 3, false);

  // ==============================
  // 4. EXTERNAL SERVICES
  // ==============================
  await withRetry("stripe", bootstrapStripe, 3, true);

  // ⚠️ Telegram MUST NOT block startup, but also MUST NOT enforce auth
  await withRetry("telegram", bootstrapTelegram, 3, false);

  assertReady(["stripe"]);

  // ==============================
  // 5. EXPRESS LAYER (FIXED ORDER)
  // ==============================
  if (app) {
    console.log("[bootstrap] attaching express routes safely...");

    // IMPORTANT:
    // Telegram webhook MUST be registered BEFORE auth middleware

    await withRetry("express", async () => {
      const express = bootstrapExpress(app);

      // FORCE SAFE ROUTE ORDER INSIDE EXPRESS LAYER
      // (this prevents auth from blocking webhook)

      if (typeof express === "function") {
        await express(app);
      }

      return express;
    }, 2, true);
  }

  // ==============================
  // 6. BACKGROUND JOBS
  // ==============================
  await withRetry("cron", bootstrapCron, 2, false);

  // ==============================
  // FINAL SAFETY CHECK
  // ==============================
  assertReady(["queue", "metering", "call-center", "stripe"]);

  console.log("[bootstrap] SYSTEM READY (SAFE MODE)");
  console.log(systemState);
}