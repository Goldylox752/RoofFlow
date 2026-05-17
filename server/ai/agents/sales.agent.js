const { runSalesAgent } = require("../agents/sales.agent");
const { runQualificationAgent } = require("../agents/qualification.agent");
const { runFollowupAgent } = require("../agents/followup.agent");

async function runLeadWorkflow(lead) {
  const qualification = await runQualificationAgent(lead);

  if (!qualification.qualified) {
    return;
  }

  const salesResult = await runSalesAgent(lead);

  if (salesResult.needsFollowup) {
    await runFollowupAgent(lead);
  }
}

module.exports = {
  runLeadWorkflow,
};