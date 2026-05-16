require("dotenv").config();
const express = require("express");

const stripeWebhook = require("./routes/stripe.webhook");
require("./bot/telegram.bot");
require("./engine/queue.worker");

const app = express();

/* RAW FOR STRIPE */
app.use("/stripe-webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));

app.use("/stripe-webhook", stripeWebhook);

app.listen(process.env.PORT || 3000, () => {
  console.log("CALL CENTER SYSTEM ONLINE");
});