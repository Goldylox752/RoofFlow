require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3001;

/* ===============================
   START SERVER
=============================== */
const server = app.listen(PORT, () => {
  console.log("=================================");
  console.log("🚀 Server Running");
  console.log(`🌎 Port: ${PORT}`);
  console.log(`🟢 Health: /health`);
  console.log("=================================");
});

/* ===============================
   GRACEFUL SHUTDOWN HELPERS
=============================== */
const shutdown = (reason, err) => {
  console.error(`❌ Server shutting down due to: ${reason}`);

  if (err) console.error(err);

  server.close(() => {
    console.log("🔴 HTTP server closed");
    process.exit(1);
  });
};

/* ===============================
   CRASH HANDLERS
=============================== */
process.on("uncaughtException", (err) => {
  shutdown("Uncaught Exception", err);
});

process.on("unhandledRejection", (err) => {
  shutdown("Unhandled Promise Rejection", err);
});

/* ===============================
   SAFE TERMINATION (Render / Linux)
=============================== */
process.on("SIGTERM", () => {
  console.log("📴 SIGTERM received");
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  console.log("📴 SIGINT received");
  shutdown("SIGINT");
});