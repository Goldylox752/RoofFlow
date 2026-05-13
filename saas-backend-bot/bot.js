require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json());

/* ===============================
   ENV
=============================== */
const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL;
const PORT = process.env.PORT || 3000;

if (!token || !webhookUrl) {
  console.error("Missing TELEGRAM_BOT_TOKEN or WEBHOOK_URL");
  process.exit(1);
}

/* ===============================
   BOT (NO POLLING!)
=============================== */
const bot = new TelegramBot(token);

/* ===============================
   SET WEBHOOK
=============================== */
const webhookPath = `/bot${token}`;

bot.setWebHook(`${webhookUrl}${webhookPath}`);

console.log("🔗 Webhook set to:", `${webhookUrl}${webhookPath}`);

/* ===============================
   TELEGRAM WEBHOOK ENDPOINT
=============================== */
app.post(webhookPath, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

/* ===============================
   COMMANDS
=============================== */
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🚀 Webhook Bot Online (Production Mode)");
});

/* ===============================
   LOG MESSAGES
=============================== */
bot.on("message", (msg) => {
  console.log(`[${msg.chat.id}] ${msg.text}`);
});

/* ===============================
   START SERVER
=============================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});