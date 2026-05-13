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
   SECURITY
=============================== */
app.disable("x-powered-by");

/* ===============================
   BODY PARSER
=============================== */
app.use(express.json({ limit: "2mb" }));

/* ===============================
   REQUEST ID
=============================== */
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
});

/* ===============================
   RESPONSE TIMER (SAAS DEBUGGING POWER)
=============================== */
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info({
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
    }, "Request completed");
  });

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
   CORS (SAFE + NO FULL API BREAK)
=============================== */
const allowedOrigins = new Set(
  [process.env.FRONTEND_URL, "http://localhost:3000"].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      try {
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);

        return callback(null, false); // SAFE FAIL (no crash)
      } catch (err) {
        logger.error(err, "CORS error");
        return callback(null, true);
      }
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
   SAFE ROUTES
=============================== */
const safeRoute = (path) => {
  try {
    return require(path);
  } catch (err) {
    logger.warn({ path }, "Missing route file");
    return express.Router();
  }
};

app.use("/api/leads", safeRoute("./routes/leadRoutes"));
app.use("/api/webhook", safeRoute("./routes/webhook"));
app.use("/api/payments", safeRoute("./routes/payments"));
app.use("/api/telegram", safeRoute("./routes/telegramWebhook"));

/* ===============================
   HEALTH
=============================== */
app.get("/health", (req, res) => {
  logger.info({ requestId: req.id }, "Health check");

  res.status(200).json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
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
   404
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
      error: err.message,
      stack: err.stack,
      requestId: req.id,
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