require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

/* ===============================
   LOAD COMMAND MODULES
=============================== */
require("./commands/admin.commands")(bot);
require("./commands/user.commands")(bot);
require("./commands/stripe.commands")(bot);

bot.on("polling_error", console.error);

module.exports = bot;