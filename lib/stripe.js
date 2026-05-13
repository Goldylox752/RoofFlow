const Stripe = require("stripe");

/* ===============================
   ENV VALIDATION
=============================== */

function requireEnv(key) {
  const value = process.env[key];

  if (!value || typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
}

/* ===============================
   STRIPE INIT
=============================== */

const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
  apiVersion: "2025-04-30.basil",
  maxNetworkRetries: 2,
  timeout: 30000,
});

/* ===============================
   EXPORT
=============================== */

module.exports = stripe;