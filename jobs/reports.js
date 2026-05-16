const { sendDailyReport, sendWeeklyReport } = require("../lib/reports");

async function runReportsJob(type) {
  if (type === "daily") {
    console.log("Running daily report...");
    await sendDailyReport();
  }

  if (type === "weekly") {
    console.log("Running weekly report...");
    await sendWeeklyReport();
  }
}

module.exports = { runReportsJob };