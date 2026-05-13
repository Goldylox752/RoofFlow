require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

/* ===============================
   TRUST PROXY (Render / Vercel / VPS safe)
=============================== */
app.set("trust proxy", 1);

/* ===============================
   SECURITY
=============================== */
app.disable("x-powered-by");

/* ===============================
   BODY PARSER
=============================== */
app.use(express.json({ limit: "2mb" }));

/* ===============================
   RATE LIMITING
=============================== */
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

/* ===============================
   CORS (SAFE + NO CRASHES)
=============================== */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

/* ===============================
   REQUEST LOGGER
=============================== */
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

/* ===============================
   SAFE ROUTE LOADER (PREVENT CRASHES)
=============================== */
const safeRoute = (path) => {
  try {
    return require(path);
  } catch (err) {
    console.warn(`⚠️ Missing route: ${path}`);
    return express.Router();
  }
};

/* ===============================
   ROUTES
=============================== */
app.use("/api/leads", safeRoute("./routes/leadRoutes"));
app.use("/api/webhook", safeRoute("./routes/webhook"));
app.use("/api/payments", safeRoute("./routes/payments"));
app.use("/api/telegram", safeRoute("./routes/telegramWebhook"));

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    service: "Lead Backend API",
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

/* ===============================
   ROOT
=============================== */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Lead backend running",
    endpoints: ["/api/leads", "/health"],
  });
});

/* ===============================
   404 HANDLER
=============================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

/* ===============================
   GLOBAL ERROR HANDLER
=============================== */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

module.exports = app;