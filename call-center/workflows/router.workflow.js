const { scoreLead } = require("../scoring.model");
const { routeLead } = require("../rules.engine");

const adminWorkflow = require("./admin.workflow");
const userWorkflow = require("./user.workflow");
const billingWorkflow = require("./billing.workflow");

/* =========================================================
   INTENT DETECTION (clean + extensible)
========================================================= */
const INTENT_MAP = [
  {
    intent: "ADMIN",
    keywords: ["admin", "administrator", "superuser", "override", "backdoor"],
  },
  {
    intent: "BILLING",
    keywords: [
      "invoice",
      "billing",
      "payment",
      "charge",
      "refund",
      "subscription",
      "plan",
      "pricing",
    ],
  },
  {
    intent: "SUPPORT",
    keywords: ["help", "issue", "broken", "error", "not working", "bug", "fix"],
  },
  {
    intent: "SALES",
    keywords: ["buy", "purchase", "upgrade", "demo", "trial", "quote"],
  },
];

/* =========================================================
   WORKFLOW REGISTRY
========================================================= */
const WORKFLOW_MAP = {
  ADMIN: adminWorkflow,
  BILLING: billingWorkflow,
  SUPPORT: userWorkflow,
  SALES: userWorkflow,
  USER: userWorkflow,
};

/* fallback safety net */
const FALLBACK_WORKFLOW = userWorkflow;

/* =========================================================
   INTENT DETECTION
========================================================= */
function detectIntent(text = "") {
  const normalized = text.toLowerCase();

  for (const { intent, keywords } of INTENT_MAP) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return intent;
    }
  }

  return "USER";
}

/* =========================================================
   SCORE TIER
========================================================= */
function getScoreTier(score) {
  if (score >= 80) return "HOT";
  if (score >= 50) return "WARM";
  return "COLD";
}

/* =========================================================
   ROUTING CONFIDENCE ENGINE (NEW)
========================================================= */
function calculateConfidence(score, intent) {
  let confidence = 0.5;

  if (score >= 80) confidence += 0.3;
  else if (score >= 50) confidence += 0.15;

  if (intent === "ADMIN") confidence += 0.2;
  if (intent === "BILLING") confidence += 0.15;
  if (intent === "SALES") confidence += 0.1;

  return Math.min(confidence, 1);
}

/* =========================================================
   SAFE EXECUTION WRAPPER
========================================================= */
async function safeExecute(workflow, lead, decision) {
  try {
    return await workflow(lead, decision);
  } catch (err) {
    console.error(`[workflow error] ${err.message}`);

    // fallback execution
    return await FALLBACK_WORKFLOW(lead, decision);
  }
}

/* =========================================================
   MAIN BRAIN ROUTER
========================================================= */
async function routeWorkflow(lead) {
  const score = scoreLead(lead);
  const tier = getScoreTier(score);

  const intent = detectIntent(lead.text || "");

  const enriched = {
    ...lead,
    score,
    tier,
    intent,
    routedAt: new Date().toISOString(),
  };

  const decision = routeLead(enriched);

  const confidence = calculateConfidence(score, intent);

  const primaryWorkflow =
    WORKFLOW_MAP[intent] || FALLBACK_WORKFLOW;

  console.log(
    `[router] intent=${intent} tier=${tier} score=${score} confidence=${confidence.toFixed(
      2
    )} ref=${lead.metadata?.messageId ?? lead.chatId}`
  );

  /* =========================================================
     EXECUTE PRIMARY WITH FALLBACK SAFETY
  ========================================================= */
  const result = await safeExecute(
    primaryWorkflow,
    enriched,
    decision
  );

  return {
    ...result,
    intent,
    tier,
    score,
    confidence,
  };
}

module.exports = { routeWorkflow };