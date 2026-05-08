require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

/* ===============================
   CORS (production-safe)
=============================== */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

/* ===============================
   WEBHOOK ROUTE (MUST BE FIRST)
   Stripe requires raw body
=============================== */
app.use(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  require("./routes/webhook")
);

/* ===============================
   NORMAL JSON ROUTES
=============================== */
app.use(express.json());

/* ===============================
   ROUTES
=============================== */
app.use("/api/payments", require("./routes/payments"));

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Flow OS backend running",
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

module.exports = app;