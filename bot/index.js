require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: false,
});

const ADMIN_IDS = (process.env.ADMIN_IDS || "").split(",");

function isAdmin(id) {
  return ADMIN_IDS.includes(String(id));
}

/* ===============================
   COMMAND ROUTER
=============================== */

bot.onText(/\/start/, async (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `SaaS Control Panel Online

Commands:
/users
/leads
/revenue
/plan`
  );
});

/* ===============================
   USERS DASHBOARD
=============================== */
bot.onText(/\/users/, async (msg) => {
  if (!isAdmin(msg.from.id)) return;

  const users = global.users || [];

  bot.sendMessage(
    msg.chat.id,
    `Total Users: ${users.length}`
  );
});

/* ===============================
   LEADS DASHBOARD
=============================== */
bot.onText(/\/leads/, async (msg) => {
  if (!isAdmin(msg.from.id)) return;

  const leads = global.leads || [];

  const last5 = leads.slice(-5);

  const text = last5
    .map(
      (l) =>
        `Lead: ${l.email || l.phone}
Score: ${l.score}
City: ${l.city}`
    )
    .join("\n\n");

  bot.sendMessage(msg.chat.id, text || "No leads yet");
});

/* ===============================
   REVENUE (STRIPE HOOK)
=============================== */
bot.onText(/\/revenue/, async (msg) => {
  if (!isAdmin(msg.from.id)) return;

  const revenue = global.revenue || 0;

  bot.sendMessage(
    msg.chat.id,
    `Total Revenue: $${revenue}`
  );
});

/* ===============================
   MANUAL UPGRADE USER
=============================== */
bot.onText(/\/upgrade (\d+)/, async (msg, match) => {
  if (!isAdmin(msg.from.id)) return;

  const userId = match[1];

  bot.sendMessage(
    msg.chat.id,
    `User ${userId} upgraded to PRO`
  );
});

module.exports = bot;