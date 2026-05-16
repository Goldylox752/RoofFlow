const pino = require("pino");

/* ===============================
   ENV SETUP
=============================== */
const isProd = process.env.NODE_ENV === "production";

/* ===============================
   BASE LOGGER
=============================== */
const baseLogger = pino({
  level: isProd ? "info" : "debug",

  base: {
    service: "saas-backend",
    env: process.env.NODE_ENV || "development",
  },

  timestamp: pino.stdTimeFunctions.isoTime,
});

/* ===============================
   HELPERS (CLEAN WRAPPERS)
=============================== */

const withContext = (context = {}) => {
  return baseLogger.child(context);
};

const event = (eventName, data = {}) => {
  baseLogger.info(
    {
      event: eventName,
      ...data,
    },
    "business_event"
  );
};

const stripe = (event, data = {}) => {
  baseLogger.info(
    {
      source: "stripe",
      event,
      ...data,
    },
    "stripe_event"
  );
};

const lead = (action, data = {}) => {
  baseLogger.info(
    {
      module: "leads",
      action,
      ...data,
    },
    "lead_event"
  );
};

const errorLog = (err, context = {}) => {
  baseLogger.error(
    {
      message: err?.message,
      stack: err?.stack,
      ...context,
    },
    "error_event"
  );
};

const performance = (label, ms, meta = {}) => {
  baseLogger.info(
    {
      metric: "performance",
      label,
      ms,
      ...meta,
    },
    "performance_event"
  );
};

/* ===============================
   EXPORT (SAFE + CONSISTENT)
=============================== */
module.exports = {
  logger: baseLogger,
  withContext,
  event,
  stripe,
  lead,
  errorLog,
  performance,
};