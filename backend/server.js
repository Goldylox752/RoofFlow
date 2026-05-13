require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 3000;

/* ===============================
   START SERVER
=============================== */
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

/* ===============================
   PRODUCTION HARDENING
=============================== */
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

/* ===============================
   CRASH SAFETY
=============================== */
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  // optional: process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("⚠️ Unhandled Rejection:", err);
  // optional: process.exit(1);
});

/* ===============================
   GRACEFUL SHUTDOWN (IMPORTANT)
=============================== */
process.on("SIGTERM", () => {
  console.log("🔻 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});