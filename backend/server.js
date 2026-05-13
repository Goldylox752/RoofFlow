require("dotenv").config();

/* ===============================
   LOAD APP SAFELY
=============================== */
let app;

try {
  app = require("./app");
} catch (err) {
  console.error("❌ Missing or broken ./app.js");
  console.error("Fix: create app.js with Express setup");
  process.exit(1);
}

const PORT = process.env.PORT
  ? Number(process.env.PORT)
  : 3000;

/* ===============================
   CONFIG CHECK
=============================== */
if (!process.env.PORT) {
  console.warn("⚠️ PORT not set. Using default 3000");
}

/* ===============================
   START SERVER
=============================== */
const server = app.listen(PORT, () => {
  console.log("==================================");
  console.log("🚀 Server running successfully");
  console.log(`📡 Port: ${PORT}`);
  console.log("❤️ Health: /health");
  console.log("🌐 API: /api");
  console.log("==================================");
});

/* ===============================
   SERVER STABILITY SETTINGS
=============================== */
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

/* ===============================
   GRACEFUL SHUTDOWN
=============================== */
let isShuttingDown = false;

const shutdown = (reason, error = null) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`🛑 Shutdown: ${reason}`);

  if (error) {
    console.error(error);
  }

  server.close(() => {
    console.log("✅ Server closed cleanly");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("⚠️ Forced shutdown");
    process.exit(1);
  }, 10000).unref();
};

/* ===============================
   ERROR HANDLING
=============================== */
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception");
  shutdown("uncaughtException", err);
});

process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection");
  shutdown("unhandledRejection", err);
});

/* ===============================
   SIGNALS
=============================== */
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));