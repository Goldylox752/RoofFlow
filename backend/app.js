require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const logger = require("./lib/logger");

const app = express();

/* ===============================
   BASIC SECURITY
=============================== */
app.set("trust proxy", 1);
app.disable("x-powered-by");

/* ===============================
   BODY PARSER
=============================== */
app.use(express.json({ limit: "2mb" }));

/* ===============================
   REQUEST ID MIDDLEWARE
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
   CORS
=============================== */
const allowedOrigins = new Set(
  [process.env.FRONTEND_URL, "http://localhost:3000"].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      if (allowedOrigins.has(origin)) return cb(null, true);

      logger.warn({ origin }, "Blocked CORS request");
      return cb(new Error("CORS blocked"), false);
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
      },
      "Request completed"
    );
  });

  next();
});

/* ===============================
   AUTH PLACEHOLDER
=============================== */
app.use((req, res, next) => {
  req.user = null;
  next();
});

/* ===============================
   SAFE ROUTE LOADER (HARDENED)
=============================== */
const loadRoute = (path) => {
  try {
    const route = require(path);

    if (!route) {
      logger.warn({ path }, "Route returned empty module");
      return express.Router();
    }

    return route;
  } catch (err) {
    logger.error(
      {
        path,
        message: err.message,
      },
      "Failed to load route"
    );

    return express.Router();
  }
};

/* ===============================
   ROUTES
=============================== */
app.use("/api/webhook", loadRoute("./routes/webhook"));
app.use("/api/telegram", loadRoute("./routes/telegramWebhook"));
app.use("/api/leads", loadRoute("./routes/leadRoutes"));
app.use("/api/payments", loadRoute("./routes/payments"));

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/health", (req, res) => {
  res.json({
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
    message: "Backend running",
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
    },
    "Unhandled error"
  );

  res.status(500).json({
    success: false,
    error: "Internal server error",
    requestId: req.id,
  });
});

module.exports = app;