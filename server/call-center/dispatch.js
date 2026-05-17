const { emitEvent } = require("../app/events/event.emitter");
const { scoreLead } = require("./scoring.model");
const { routeWorkflow } = require("./workflows/router.workflow");

async function dispatchLead(lead) {
  const score = scoreLead(lead);

  const enriched = {
    ...lead,
    score,
  };

  const decision = await routeWorkflow(enriched);

  const eventType =
    decision?.type === "CALL"
      ? "CALL_TRIGGERED"
      : decision?.type === "SMS"
      ? "SMS_SENT"
      : "LEAD_ASSIGNED";

  await emitEvent({
    type: eventType,
    lead: enriched,
    decision,
    metadata: {
      source: lead.source,
    },
  });

  return {
    success: true,
    eventType,
  };
}

module.exports = { dispatchLead };