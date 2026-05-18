require("dotenv").config();
const express = require("express");
const http = require("http");

const auth = require("./middleware/auth");
const telegramHandler = require("./routes/telegram.webhook"); // adjust path if needed

const app = express();

/* ===============================
   GLOBAL MIDDLEWARE
=============================== */
app.use(express.json());

/* ===============================
   HEALTH CHECK (PUBLIC)
=============================== */
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

/* ===============================
   TELEGRAM WEBHOOK (PUBLIC - NO AUTH)
   MUST BE BEFORE AUTH MIDDLEWARE
=============================== */
app.post("/api/telegram/webhook", telegramHandler);

/* ===============================
   AUTH MIDDLEWARE (PROTECT EVERYTHING ELSE)
=============================== */
app.use((req, res, next) => {
  // 🔥 SKIP TELEGRAM WEBHOOK
  if (req.path.startsWith("/api/telegram/webhook")) {
    return next();
  }

  return auth(req, res, next);
});

/* ===============================
   PROTECTED ROUTES
=============================== */
app.use("/api", require("./routes")); // your normal APIs

/* ===============================
   START SERVER
=============================== */
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("==================================");
  console.log("🚀 SERVER STARTED");
  console.log(`🌐 Port: ${PORT}`);
  console.log("🤖 Telegram webhook enabled");
  console.log("==================================");
});

/* ===============================
   ERROR HANDLING
=============================== */
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

module.exports = app;