const { routeWorkflow } = require("./workflows/router.workflow");

const DISPATCH_TIMEOUT_MS = 10000; // 10s max per lead

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Dispatch timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function validateLead(lead) {
  const required = ["source", "chatId", "text", "user"];
  const missing = required.filter((key) => !lead?.[key]);
  if (missing.length) {
    throw new Error(`Invalid lead — missing fields: ${missing.join(", ")}`);
  }
}

async function dispatchLead(lead) {
  const startTime = Date.now();
  const ref = lead?.metadata?.messageId ?? lead?.chatId ?? "unknown";

  try {
    validateLead(lead);

    console.log(`[dispatch] routing lead | source=${lead.source} ref=${ref}`);

    const result = await withTimeout(routeWorkflow(lead), DISPATCH_TIMEOUT_MS);

    const duration = Date.now() - startTime;
    console.log(`[dispatch] success | ref=${ref} duration=${duration}ms`);

    return {
      success: true,
      leadId: result?.leadId ?? `LEAD-${Date.now()}`,
      duration,
      ...result,
    };

  } catch (err) {
    const duration = Date.now() - startTime;

    console.error(`[dispatch] failed | ref=${ref} duration=${duration}ms error=${err.message}`);

    return {
      success: false,
      leadId: null,
      error: err.message,
      duration,
    };
  }
}

module.exports = { dispatchLead };
