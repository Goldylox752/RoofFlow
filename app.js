const express = require("express");
const bot = require("./config/telegram");

const app = express();

/* ===============================
   MIDDLEWARE
=============================== */
app.use("/stripe-webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));

/* ===============================
   TELEGRAM BOOTSTRAP ONLY
=============================== */
require("./bots/telegram"); // all logic moved out

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "telegram-stripe-saas",
    bot: !!bot,
  });
});

module.exports = app;