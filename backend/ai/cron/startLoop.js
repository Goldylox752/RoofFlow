const { runAgentLoop } = require("./agentLoop");

const INTERVAL_MS = 60 * 1000; // every 60 seconds

function startAIEngine() {
  console.log("🚀 Starting AI Sales Engine (24/7)");

  // initial run
  runAgentLoop();

  // continuous loop
  setInterval(() => {
    runAgentLoop();
  }, INTERVAL_MS);
}

module.exports = { startAIEngine };