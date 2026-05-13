require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3001;

if (!process.env.PORT) {
  console.warn("⚠️ Using fallback port 3001 (local only)");
}

/* ===============================
   START SERVER
=============================== */

let server = null;

try {
  server = app.listen(PORT, () => {
    console.log("=================================");
    console.log("🚀 Server Running");
    console.log(`📡 Port: ${PORT}`);
    console.log("❤️ Health: /health");
    console.log("=================================");
    console.log("🚀 Server fully ready for requests");
  });

  // Render stability tuning
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

} catch (err) {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
}

/* ===============================
   SHUTDOWN SYSTEM
=============================== */

let isShuttingDown = false;

const shutdown = (reason, err = null, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 Shutdown triggered: ${reason}`);

  if (err) console.error(err);

  if (!server) return process.exit(exitCode);

  server.close(() => {
    console.log("✅ Server closed cleanly");
    process.exit(exitCode);
  });

  setTimeout(() => {
    console.error("⚠️ Forced shutdown timeout");
    process.exit(exitCode);
  }, 10000).unref();
};

/* ===============================
   ERROR HANDLERS
=============================== */

process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION");
  shutdown("uncaughtException", err, 1);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 UNHANDLED REJECTION");
  shutdown("unhandledRejection", err, 1);
});

/* ===============================
   SIGNAL HANDLERS
=============================== */

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));