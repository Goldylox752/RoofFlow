require("dotenv").config();

const express = require("express");

const stripeWebhook = require("./routes/stripe.webhook");

/* ===============================
   BOOT SERVICES (SIDE EFFECTS)
=============================== */
require("./bot/telegram.bot");
require("./engine/queue.worker");

/* ===============================
   EXPRESS APP
=============================== */
const app = express();

/* ===============================
   STRIPE RAW BODY (IMPORTANT)
=============================== */
app.use("/stripe-webhook", express.raw({ type: "application/json" }));

/* ===============================
   JSON BODY PARSER
=============================== */
app.use(express.json({ limit: "1mb" }));

/* ===============================
   ROUTES
=============================== */
app.use("/stripe-webhook", stripeWebhook);

/* ===============================
   START SERVER
=============================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`CALL CENTER SYSTEM ONLINE 🚀 (port ${PORT})`);
});