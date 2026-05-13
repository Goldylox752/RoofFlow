require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, {
  polling: true,
});

console.log("Bot started...");

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🚀 Login Bot Online"
  );
});

bot.on("message", (msg) => {
  console.log(msg.text);
});