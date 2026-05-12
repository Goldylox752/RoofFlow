require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3001;

if (!process.env.PORT) {
  console.warn("⚠️ PORT not set in env, using fallback 3001");
}

let server = null;

/* ===============================
   START SERVER
=============================== */

try {
  server = app.listen(PORT, () => {
    console.log("=================================");
    console.log("🚀 Server Running");
    console.log(`📡 Port: ${PORT}`);
    console.log("❤️ Health: /health");
    console.log("=================================");
  });

  // Render / production stability tuning
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

} catch (err) {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
}

/* ===============================
   GRACEFUL SHUTDOWN
=============================== */

let isShuttingDown = false;

const shutdown = (reason, err = null, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 Shutdown triggered: ${reason}`);

  if (err) {
    console.error("Error details:", err);
  }

  if (!server) {
    return process.exit(exitCode);
  }

  server.close(() => {
    console.log("✅ HTTP server closed cleanly");
    process.exit(exitCode);
  });

  // safety fallback (Render sometimes hangs)
  setTimeout(() => {
    console.error("⚠️ Forced shutdown (timeout reached)");
    process.exit(exitCode);
  }, 10000).unref();
};

/* ===============================
   CRASH HANDLERS
=============================== */

process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION");
  console.error(err);
  shutdown("uncaughtException", err, 1);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 UNHANDLED PROMISE REJECTION");
  shutdown("unhandledRejection", err, 1);
});

/* ===============================
   SIGNAL HANDLERS (Render-safe)
=============================== */

process.on("SIGTERM", () => {
  shutdown("SIGTERM", null, 0);
});

process.on("SIGINT", () => {
  shutdown("SIGINT", null, 0);
});