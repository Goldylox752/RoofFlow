require("dotenv").config();

/* ===============================
   LOAD APP SAFELY
=============================== */
let app;

try {
  app = require("./app");
} catch (err) {
  console.error("Missing or broken ./app.js");
  console.error("Fix: ensure app.js exports an Express app instance");
  process.exit(1);
}

/* ===============================
   PORT CONFIG
=============================== */
const PORT = Number(process.env.PORT) || 3000;

/* ===============================
   CONFIG WARNINGS
=============================== */
if (!process.env.PORT) {
  console.warn("PORT not set. Using default 3000");
}

/* ===============================
   START SERVER
=============================== */
const server = app.listen(PORT, () => {
  console.log("==================================");
  console.log("Server started");
  console.log(`Port: ${PORT}`);
  console.log("Health: /health");
  console.log("API: /api");
  console.log("==================================");
});

/* ===============================
   SERVER HARDENING
=============================== */
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

/* ===============================
   GRACEFUL SHUTDOWN
=============================== */
let shuttingDown = false;

const shutdown = (reason, error) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Shutdown triggered: ${reason}`);

  if (error) {
    console.error("Error details:", error);
  }

  server.close(() => {
    console.log("Server closed cleanly");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown (timeout)");
    process.exit(1);
  }, 10000).unref();
};

/* ===============================
   PROCESS ERROR HANDLING
=============================== */
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception detected");
  shutdown("uncaughtException", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection");
  shutdown("unhandledRejection", err);
});

/* ===============================
   SIGNAL HANDLING
=============================== */
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));