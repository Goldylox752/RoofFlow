require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

/**
 * SINGLE BOT INSTANCE (IMPORTANT)
 * Do NOT create bot anywhere else in the app.
 */

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error("Missing TELEGRAM_BOT_TOKEN");
}

// polling = good for Render small apps
// later we can switch to webhook for scaling
const bot = new TelegramBot(token, {
  polling: true,
});

console.log("🤖 Telegram bot initialized");

module.exports = bot;