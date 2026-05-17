const { processLeadQueue } = require("./engine.queue");

async function runEngineLoop() {
  try {
    console.log("🤖 AI Engine Tick");

    await processLeadQueue();
  } catch (err) {
    console.error("Engine loop failed:", err);
  }
}

module.exports = { runEngineLoop };