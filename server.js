require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3000;

/* ===============================
   START SERVER
=============================== */
const server = app.listen(PORT, () => {
  console.log("=================================");
  console.log("NorthSky Server Online");
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("=================================");
});

/* ===============================
   STATE
=============================== */
let shuttingDown = false;

/* ===============================
   SHUTDOWN HANDLER
=============================== */
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Shutdown initiated: ${signal}`);

  // Stop accepting new requests
  server.close((err) => {
    if (err) {
      console.error("Error closing HTTP server:", err);
    } else {
      console.log("HTTP server closed cleanly");
    }
  });

  // Future cleanup hooks (safe for SaaS scaling)
  cleanupResources().catch((err) => {
    console.error("Cleanup error:", err);
  });

  // Hard stop fallback (prevents hanging deploys)
  setTimeout(() => {
    console.error("Forced shutdown (timeout reached)");
    process.exit(1);
  }, 10000).unref();
}

/* ===============================
   RESOURCE CLEANUP (EXTENDABLE)
=============================== */
async function cleanupResources() {
  // Placeholder for future SaaS infrastructure shutdowns:

  // await closeDatabase();
  // await closeRedis();
  // await stopQueueWorkers();
  // await flushLogs();

  return true;
}

/* ===============================
   SIGNAL HANDLERS
=============================== */
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

/* ===============================
   GLOBAL SAFETY NET
=============================== */
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  shutdown("unhandledRejection");
});