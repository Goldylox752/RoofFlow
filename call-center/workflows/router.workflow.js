const { scoreLead } = require("../scoring.model");
const { routeLead } = require("../rules.engine");

const adminWorkflow = require("./admin.workflow");
const userWorkflow = require("./user.workflow");
const billingWorkflow = require("./billing.workflow");

async function routeWorkflow(lead) {
  const score = scoreLead(lead);

  const enriched = {
    ...lead,
    score,
  };

  const decision = routeLead(enriched);

  const intent = detectIntent(enriched);

  switch (intent) {
    case "ADMIN":
      return adminWorkflow(enriched, decision);

    case "BILLING":
      return billingWorkflow(enriched, decision);

    case "USER":
    default:
      return userWorkflow(enriched, decision);
  }
}

/* ===============================
   SIMPLE AI INTENT DETECTOR (upgrade later)
=============================== */
function detectIntent(lead) {
  const text = (lead.text || "").toLowerCase();

  if (text.includes("admin")) return "ADMIN";
  if (text.includes("invoice") || text.includes("billing")) return "BILLING";

  return "USER";
}

module.exports = { routeWorkflow };