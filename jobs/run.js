require("dotenv").config();

const { runReportsJob } = require("./reports.job");
const { runIngestJob } = require("./ingest.job");

async function main() {
  const job = process.argv[2];

  try {
    switch (job) {
      case "daily":
        await runReportsJob("daily");
        break;

      case "weekly":
        await runReportsJob("weekly");
        break;

      case "ingest":
        await runIngestJob();
        break;

      default:
        console.log("Usage: node jobs/run.js [daily|weekly|ingest]");
    }
  } catch (err) {
    console.error("Job failed:", err);
  }

  process.exit(0);
}

main();