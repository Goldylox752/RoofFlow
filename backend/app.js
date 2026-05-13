require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

/* ===============================
   TRUST PROXY
=============================== */
app.set("trust proxy", 1);

/* ===============================
   SECURITY HEADERS
=============================== */
app.disable("x-powered-by");

/* ===============================
   CORS (SAAS SAFE)
=============================== */
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  "http://localhost:3000",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("CORS blocked"));
    },
    credentials: true,
  })
);

/* ===============================
   BODY PARSERS
=============================== */
app.use(express.json({ limit: "2mb" }));

/* ===============================
   ROUTES
=============================== */
app.use("/api/webhook", require("./routes/webhook"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/telegram", require("./routes/telegramWebhook"));

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    service: "Flow OS Backend",
    time: new Date().toISOString(),
  });
});

/* ===============================
   ROOT
=============================== */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Flow OS backend running",
  });
});

/* ===============================
   404
=============================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

/* ===============================
   ERROR HANDLER
=============================== */
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err);

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

module.exports = app;