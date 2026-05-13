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
   WEBHOOK PATH
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
  { command: "plan", description: "View subscription plan" },
  { command: "upgrade", description: "Upgrade to PRO" }
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
   SAAS USER STORE (TEMP MEMORY DB)
   (Replace with MongoDB later)
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
   UPGRADE SYSTEM (SaaS CORE)
=============================== */
function upgradeUser(user) {
  user.plan = "pro";
  users.set(user.telegramId, user);
}

/* ===============================
   COMMANDS
=============================== */
bot.onText(/\/start/, (msg) => {
  const user = getOrCreateUser(msg.from);

  bot.sendMessage(
    msg.chat.id,
    `Welcome ${user.username}

Plan: ${user.plan}

Commands:
/profile
/plan
/upgrade
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

Available plans:
- free
- pro`
  );
});

/* ===============================
   UPGRADE COMMAND (SAAS CORE HOOK)
=============================== */
bot.onText(/\/upgrade/, (msg) => {
  const user = getOrCreateUser(msg.from);

  if (user.plan === "pro") {
    return bot.sendMessage(msg.chat.id, "You are already PRO.");
  }

  bot.sendMessage(
    msg.chat.id,
    `Upgrade system ready.

Current plan: free
Target plan: pro

Next step: connect Stripe payment.`
  );

  // TEMP AUTO UPGRADE (REMOVE when Stripe is added)
  upgradeUser(user);

  bot.sendMessage(
    msg.chat.id,
    "You have been upgraded to PRO (demo mode)."
  );
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Commands:\n/start\n/profile\n/plan\n/upgrade\n/help\n/ping"
  );
});

bot.onText(/\/ping/, (msg) => {
  bot.sendMessage(msg.chat.id, "Pong! Bot is alive.");
});

/* ===============================
   MESSAGE HANDLER (SAFE LOGGING)
=============================== */
bot.on("message", (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;

  console.log(`[USER ${msg.from.id}] ${msg.text}`);
});

/* ===============================
   WEBHOOK ENDPOINT
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
    users: users.size,
    proUsers: Array.from(users.values()).filter(u => u.plan === "pro").length
  });
});

/* ===============================
   START SERVER
=============================== */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});