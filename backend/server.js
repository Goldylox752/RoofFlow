require("dotenv").config();
const app = require("./app");

/* ===============================
   ENV VALIDATION
=============================== */
const PORT = process.env.PORT || 3000;

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

const isProd = process.env.NODE_ENV === "production";

/* ===============================
   START SERVER
=============================== */
const server = app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});

/* ===============================
   PRODUCTION HARDENING
=============================== */
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

/* ===============================
   TRACK ACTIVE CONNECTIONS
   (important for graceful shutdown)
=============================== */
let connections = new Set();

server.on("connection", (conn) => {
  connections.add(conn);

  conn.on("close", () => {
    connections.delete(conn);
  });
});

/* ===============================
   CRASH SAFETY
=============================== */
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);

  // In production, you usually restart process via PM2/Docker
  if (isProd) process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("⚠️ Unhandled Rejection:", err);

  if (isProd) process.exit(1);
});

/* ===============================
   GRACEFUL SHUTDOWN (CLEAN)
=============================== */
const shutdown = (signal) => {
  console.log(`🔻 ${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log("✅ HTTP server closed");

    process.exit(0);
  });

  // Force close after timeout (prevents hanging deploys)
  setTimeout(() => {
    console.warn("⚠️ Force shutdown after timeout");
    process.exit(1);
  }, 10000).unref();

  // Destroy open connections
  connections.forEach((conn) => conn.destroy());
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));