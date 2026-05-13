const TelegramBot = require("node-telegram-bot-api");
const { TOKEN, WEBHOOK_URL } = require("../config/env");

if (!TOKEN || !WEBHOOK_URL) {
  throw new Error("Missing env variables");
}

const bot = new TelegramBot(TOKEN);

/* ===============================
   WEBHOOK SETUP
=============================== */
const path = `/bot${TOKEN}`;

bot.setWebHook(`${WEBHOOK_URL}${path}`);

console.log("🔗 Webhook set:", `${WEBHOOK_URL}${path}`);

/* ===============================
   COMMANDS
=============================== */
require("./commands")(bot);

module.exports = { bot, path };