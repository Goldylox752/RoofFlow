require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

/* ===============================
   CONFIG CHECK
=============================== */
if (!process.env.PORT) {
  console.warn("PORT not set in environment. Using default: 3001");
}

/* ===============================
   START SERVER
=============================== */
let server;

const startServer = () => {
  try {
    server = app.listen(PORT, () => {
      console.log("==================================");
      console.log("Server running successfully");
      console.log(`Port: ${PORT}`);
      console.log("Health endpoint: /health");
      console.log("API base: /api");
      console.log("==================================");
    });

    // Improve stability for proxies (Vercel, Render, VPS, etc.)
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

/* ===============================
   GRACEFUL SHUTDOWN
=============================== */
let isShuttingDown = false;

const shutdown = (reason, error = null) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Shutdown initiated: ${reason}`);

  if (error) {
    console.error("Shutdown error:", error);
  }

  if (!server) {
    process.exit(1);
    return;
  }

  server.close(() => {
    console.log("Server closed cleanly");
    process.exit(0);
  });

  // Force exit fallback (prevents hanging processes)
  setTimeout(() => {
    console.error("Forced shutdown (timeout reached)");
    process.exit(1);
  }, 10000).unref();
};

/* ===============================
   ERROR HANDLING
=============================== */
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception");
  shutdown("uncaughtException", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection");
  shutdown("unhandledRejection", error);
});

/* ===============================
   SIGNAL HANDLING
=============================== */
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));