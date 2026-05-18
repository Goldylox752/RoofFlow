export async function bootstrapApp() {
  console.log("[bootstrap] system starting...");

  await withRetry("queue", bootstrapQueue, 5, true);
  await withRetry("metering", bootstrapMetering, 3, true);
  await withRetry("call-center", bootstrapCallCenter, 3, true);

  await withRetry("events", bootstrapEvents, 3, false);
  await withRetry("stripe", bootstrapStripe, 3, true);
  await withRetry("telegram", bootstrapTelegram, 3, false);

  await withRetry("cron", bootstrapCron, 2, false);

  console.log("[bootstrap] SYSTEM READY");
}