require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

/* ===============================
   BOT INIT
=============================== */
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: false,
});

/* ===============================
   ADMIN CONFIG
=============================== */
const ADMIN_IDS = (process.env.ADMIN_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

function isAdmin(userId) {
  return ADMIN_IDS.includes(String(userId));
}

/* ===============================
   SAFE STORAGE LAYER (replace globals later with DB)
=============================== */
const store = {
  users: [],
  leads: [],
  revenue: 0,
};

/* ===============================
   COMMAND ROUTER HELPERS
=============================== */
function deny(msg) {
  return bot.sendMessage(msg.chat.id, "Access denied");
}

function send(msg, text) {
  return bot.sendMessage(msg.chat.id, text);
}

/* ===============================
   START
=============================== */
bot.onText(/\/start/, async (msg) => {
  send(
    msg,
    [
      "SaaS Control Panel Online",
      "",
      "Commands:",
      "/users",
      "/leads",
      "/revenue",
      "/upgrade <userId>",
    ].join("\n")
  );
});

/* ===============================
   USERS
=============================== */
bot.onText(/\/users/, async (msg) => {
  if (!isAdmin(msg.from.id)) return deny(msg);

  const count = store.users.length;

  send(msg, `Total Users: ${count}`);
});

/* ===============================
   LEADS
=============================== */
bot.onText(/\/leads/, async (msg) => {
  if (!isAdmin(msg.from.id)) return deny(msg);

  const lastLeads = store.leads.slice(-5);

  if (!lastLeads.length) {
    return send(msg, "No leads found");
  }

  const formatted = lastLeads
    .map((l, i) => {
      return [
        `Lead #${i + 1}`,
        `Email: ${l.email || "N/A"}`,
        `Phone: ${l.phone || "N/A"}`,
        `Score: ${l.score || 0}`,
        `City: ${l.city || "N/A"}`,
      ].join("\n");
    })
    .join("\n\n----------------\n\n");

  send(msg, formatted);
});

/* ===============================
   REVENUE
=============================== */
bot.onText(/\/revenue/, async (msg) => {
  if (!isAdmin(msg.from.id)) return deny(msg);

  send(msg, `Total Revenue: $${store.revenue}`);
});

/* ===============================
   MANUAL UPGRADE
=============================== */
bot.onText(/\/upgrade (\d+)/, async (msg, match) => {
  if (!isAdmin(msg.from.id)) return deny(msg);

  const userId = match?.[1];

  if (!userId) {
    return send(msg, "Usage: /upgrade <userId>");
  }

  // placeholder for DB update
  send(msg, `User ${userId} upgraded to PRO`);
});

/* ===============================
   ERROR HANDLING
=============================== */
bot.on("polling_error", (err) => {
  console.error("Telegram polling error:", err.message);
});

module.exports = bot;