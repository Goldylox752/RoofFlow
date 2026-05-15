const { enrichLead } = require("./enrich");
const { scoreLead } = require("./score");
const { routeLead } = require("./router");
const { sendOutreach } = require("./outreach");
const { processReply } = require("./replies");
const { updateCRM } = require("./crm");

async function runPipeline(lead, llm) {
  try {
    /* ===============================
       1. ENRICH LEAD
    =============================== */
    const enriched = await enrichLead(lead, llm);

    /* ===============================
       2. SCORE LEAD
    =============================== */
    const scored = await scoreLead(enriched, llm);

    /* ===============================
       3. UPDATE CRM
    =============================== */
    updateCRM(scored);

    /* ===============================
       4. ROUTE CHANNEL
    =============================== */
    const channel = routeLead(scored);

    /* ===============================
       5. OUTREACH
    =============================== */
    await sendOutreach(scored, channel, llm);

    return {
      success: true,
      stage: "outreach_sent",
      lead: scored,
    };

  } catch (err) {
    console.error("[PIPELINE_ERROR]", err);

    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = { runPipeline };