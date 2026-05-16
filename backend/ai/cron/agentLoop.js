const supabase = require("../../lib/supabase");
const { runSalesAgent } = require("../agentRunner");

const BATCH_SIZE = 50;

async function runAgentLoop() {
  console.log("🤖 AI Agent Loop Started");

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("status", "new")
    .limit(BATCH_SIZE);

  if (!leads || leads.length === 0) return;

  for (const lead of leads) {
    try {
      await runSalesAgent(lead);
    } catch (err) {
      console.error("Agent failed for lead:", lead.id, err.message);
    }
  }

  console.log(`✅ Processed ${leads.length} leads`);
}

module.exports = { runAgentLoop };