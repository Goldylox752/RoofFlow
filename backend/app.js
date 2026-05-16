require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

const app = express();

/* ===============================
   SAFE LOGGER (NO CRASH GUARANTEE)
=============================== */
const logger = (() => {
  try {
    return require("./lib/logger");
  } catch (err) {
    console.warn("⚠️ Logger not found — using console fallback");

    return {
      info: console.log,
      warn: console.warn,
      error: console.error,
    };
  }
})();

/* ===============================
   ENV SAFETY CHECK (CRITICAL)
=============================== */
const REQUIRED_ENV = ["FRONTEND_URL"];

REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️ Missing env: ${key}`);
  }
});

/* ===============================
   SECURITY SETTINGS
=============================== */
app.set("trust proxy", 1);
app.disable("x-powered-by");

/* ===============================
   BODY PARSER (SAFE LIMITS)
=============================== */
app.use(express.json({ limit: "2mb" }));

/* ===============================
   REQUEST ID (GUARANTEED)
=============================== */
app.use((req, res, next) => {
  try {
    req.id = crypto.randomUUID();
  } catch {
    req.id = `${Date.now()}-${Math.random()}`;
  }

  res.setHeader("x-request-id", req.id);
  next();
});

/* ===============================
   RATE LIMITING (FAIL-SAFE)
=============================== */
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn?.(
        { requestId: req.id, ip: req.ip },
        "Rate limit triggered"
      );

      res.status(429).json({
        success: false,
        error: "Too many requests",
        requestId: req.id,
      });
    },
  })
);

/* ===============================
   CORS (HARDENED)
=============================== */
const allowedOrigins = new Set(
  [process.env.FRONTEND_URL, "http://localhost:3000"].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      if (allowedOrigins.has(origin)) return cb(null, true);

      logger.warn?.({ origin }, "Blocked CORS request");
      return cb(null, false);
    },
    credentials: true,
  })
);

/* ===============================
   REQUEST LOGGER
=============================== */
app.use((req, res, next) => {
  logger.info?.(
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
   RESPONSE TIMER (SAFE EXIT)
=============================== */
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on("finish", () => {
    try {
      const diff = process.hrtime(start);
      const ms = diff[0] * 1000 + diff[1] / 1e6;

      logger.info?.(
        {
          requestId: req.id,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Math.round(ms),
        },
        "Request completed"
      );
    } catch (err) {
      console.error("Timing logger failed:", err);
    }
  });

  next();
});

/* ===============================
   AUTH PLACEHOLDER (SAFE EXTENSION POINT)
=============================== */
app.use((req, res, next) => {
  req.user = null;
  next();
});

/* ===============================
   SAFE ROUTE LOADER (ISOLATED FAILURES)
=============================== */
const loadRoute = (path) => {
  try {
    const route = require(path);

    if (!route) {
      logger.warn?.({ path }, "Empty route module");
      return express.Router();
    }

    return route;
  } catch (err) {
    logger.error?.(
      {
        path,
        message: err.message,
      },
      "Route load failed"
    );

    return express.Router(); // prevents full app crash
  }
};

/* ===============================
   API ROUTES
=============================== */
app.use("/api/webhook", loadRoute("./routes/webhook"));
app.use("/api/telegram", loadRoute("./routes/telegramWebhook"));
app.use("/api/leads", loadRoute("./routes/leadRoutes"));
app.use("/api/payments", loadRoute("./routes/payments"));

/* ===============================
   HEALTH CHECK (DEPLOY MONITORING)
=============================== */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    requestId: req.id,
    env: process.env.NODE_ENV || "development",
  });
});

/* ===============================
   ROOT (DEPLOY VERIFICATION)
=============================== */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SaaS backend running",
  });
});

/* ===============================
   404 HANDLER
=============================== */
app.use((req, res) => {
  logger.warn?.(
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
   GLOBAL ERROR HANDLER (SAFE)
=============================== */
app.use((err, req, res, next) => {
  try {
    logger.error?.(
      {
        message: err.message,
        stack: err.stack,
        requestId: req.id,
      },
      "Unhandled error"
    );
  } catch {
    console.error("Logger crashed during error handling");
  }

  res.status(500).json({
    success: false,
    error: "Internal server error",
    requestId: req.id,
  });
});

module.exports = app;