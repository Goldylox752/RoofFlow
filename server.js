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
   STATE TRACKING
=============================== */
let isShuttingDown = false;

/* ===============================
   SHUTDOWN HANDLER
=============================== */
async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Shutdown initiated: ${signal}`);

  try {
    // Stop accepting new requests
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          console.error("Error closing HTTP server:", err);
        } else {
          console.log("HTTP server closed cleanly");
        }
        resolve();
      });
    });

    // Future SaaS cleanup hooks (safe expansion point)
    await cleanupResources();

  } catch (err) {
    console.error("Shutdown error:", err);
  }

  // Force exit safeguard (prevents stuck deployments)
  setTimeout(() => {
    console.error("Forced shutdown (timeout reached)");
    process.exit(1);
  }, 10000).unref();
}

/* ===============================
   CLEANUP HOOKS (EXTENDABLE)
=============================== */
async function cleanupResources() {
  // Future integrations:
  // - database close
  // - redis shutdown
  // - queue worker stop
  // - AI agent loop stop

  return true;
}

/* ===============================
   SIGNAL HANDLERS
=============================== */
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

/* ===============================
   GLOBAL ERROR SAFETY
=============================== */
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  shutdown("unhandledRejection");
});