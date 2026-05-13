require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

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
   EXPRESS APP
=============================== */
const app = express();
app.use(express.json({ limit: "1mb" }));

/* ===============================
   BOT (NO POLLING)
=============================== */
const bot = new TelegramBot(token);

/* ===============================
   WEBHOOK PATH (SECURE)
=============================== */
const webhookPath = "/telegram-webhook";
const fullWebhookUrl = `${webhookUrl}${webhookPath}`;

/* ===============================
   TELEGRAM COMMAND MENU
=============================== */
bot.setMyCommands([
  { command: "start", description: "Start bot" },
  { command: "help", description: "Help menu" },
  { command: "ping", description: "Check bot status" },
  { command: "profile", description: "View profile" },
  { command: "plan", description: "View subscription plan" }
]);

/* ===============================
   SET WEBHOOK
=============================== */
async function initWebhook() {
  try {
    await bot.setWebHook(fullWebhookUrl);
    console.log("Webhook set to:", fullWebhookUrl);
  } catch (err) {
    console.error("Failed to set webhook:", err);
  }
}

initWebhook();

/* ===============================
   SAAS USER STORE (IN-MEMORY)
   Replace with MongoDB in production
=============================== */
const users = new Map();

function getOrCreateUser(tgUser) {
  let user = users.get(tgUser.id);

  if (!user) {
    user = {
      telegramId: tgUser.id,
      username: tgUser.username || "unknown",
      plan: "free",
      createdAt: new Date()
    };

    users.set(tgUser.id, user);
  }

  return user;
}

/* ===============================
   COMMANDS
=============================== */
bot.onText(/\/start/, (msg) => {
  const user = getOrCreateUser(msg.from);

  bot.sendMessage(
    msg.chat.id,
    `Welcome ${user.username}

Your plan: ${user.plan}

Commands:
/profile
/plan
/help`
  );
});

bot.onText(/\/profile/, (msg) => {
  const user = getOrCreateUser(msg.from);

  bot.sendMessage(
    msg.chat.id,
    `Profile:
ID: ${user.telegramId}
Username: ${user.username}
Plan: ${user.plan}`
  );
});

bot.onText(/\/plan/, (msg) => {
  const user = getOrCreateUser(msg.from);

  bot.sendMessage(
    msg.chat.id,
    `Current Plan: ${user.plan}

Upgrade options:
- free
- pro (coming soon)`
  );
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Commands:\n/start\n/profile\n/plan\n/help\n/ping"
  );
});

bot.onText(/\/ping/, (msg) => {
  bot.sendMessage(msg.chat.id, "Pong! Bot is alive.");
});

/* ===============================
   MESSAGE HANDLER (SAFE)
=============================== */
bot.on("message", (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;

  console.log(`[USER ${msg.from.id}] ${msg.text}`);
});

/* ===============================
   WEBHOOK ENDPOINT (ROBUST)
=============================== */
app.post(webhookPath, (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

/* ===============================
   HEALTH CHECK (SAAS MONITORING)
=============================== */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    users: users.size
  });
});

/* ===============================
   START SERVER
=============================== */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});