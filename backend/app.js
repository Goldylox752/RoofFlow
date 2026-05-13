require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const logger = require("./lib/logger");

const app = express();

/* ===============================
   TRUST PROXY
=============================== */
app.set("trust proxy", 1);

/* ===============================
   SECURITY HARDENING
=============================== */
app.disable("x-powered-by");

/* ===============================
   BODY PARSER
=============================== */
app.use(express.json({ limit: "2mb" }));

/* ===============================
   REQUEST ID + CONTEXT
=============================== */
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
});

/* ===============================
   RATE LIMITING
=============================== */
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: "Too many requests",
    },
  })
);

/* ===============================
   CORS (SAAS SAFE)
=============================== */
const allowedOrigins = new Set(
  [process.env.FRONTEND_URL, "http://localhost:3000"].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      logger.warn({ origin }, "Blocked CORS request");
      return callback(new Error("CORS blocked"), false);
    },
    credentials: true,
  })
);

/* ===============================
   REQUEST LOGGER
=============================== */
app.use((req, res, next) => {
  logger.info(
    {
      method: req.method,
      path: req.path,
      requestId: req.id,
    },
    "Incoming request"
  );

  next();
});

/* ===============================
   RESPONSE TIMER
=============================== */
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const ms = diff[0] * 1000 + diff[1] / 1e6;

    logger.info(
      {
        requestId: req.id,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Math.round(ms),
        userId: req.user?.id || null,   // 🔐 AUTH HOOK READY
      },
      "Request completed"
    );
  });

  next();
});

/* ===============================
   AUTH HOOK (SAFE PLACEHOLDER)
=============================== */
// This allows you to plug JWT auth later without rewriting app.js
app.use((req, res, next) => {
  req.user = null; // will be replaced by auth middleware later
  next();
});

/* ===============================
   SAFE ROUTE LOADER
=============================== */
const safeRoute = (path) => {
  try {
    return require(path);
  } catch (err) {
    logger.warn({ path }, "Missing route file");
    return express.Router();
  }
};

/* ===============================
   PUBLIC ROUTES
=============================== */
app.use("/api/webhook", safeRoute("./routes/webhook"));
app.use("/api/telegram", safeRoute("./routes/telegramWebhook"));

/* ===============================
   PRIVATE ROUTES (READY FOR AUTH)
=============================== */
app.use("/api/leads", safeRoute("./routes/leadRoutes"));
app.use("/api/payments", safeRoute("./routes/payments"));

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    requestId: req.id,
  });
});

/* ===============================
   ROOT
=============================== */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Lead backend running",
  });
});

/* ===============================
   404 HANDLER
=============================== */
app.use((req, res) => {
  logger.warn(
    {
      method: req.method,
      path: req.path,
      requestId: req.id,
    },
    "Route not found"
  );

  res.status(404).json({
    success: false,
    error: "Route not found",
    requestId: req.id,
  });
});

/* ===============================
   GLOBAL ERROR HANDLER
=============================== */
app.use((err, req, res, next) => {
  logger.error(
    {
      message: err.message,
      stack: err.stack,
      requestId: req.id,
      userId: req.user?.id || null,
    },
    "Unhandled server error"
  );

  res.status(500).json({
    success: false,
    error: "Internal server error",
    requestId: req.id,
  });
});

module.exports = app;