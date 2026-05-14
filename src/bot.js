const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

/* simple send helper */
function send(chatId, text) {
  return bot.sendMessage(chatId, text);
}

/* start message */
bot.onText(/\/start/, (msg) => {
  send(
    msg.chat.id,
    "Welcome to Lead Marketplace\n\nUse /leads to view available leads"
  );
});

/* leads */
bot.onText(/\/leads/, (msg) => {
  send(
    msg.chat.id,
    "Available Leads:\n\n1. Roofing Calgary - $49\n2. HVAC Toronto - $79\n\nUse /buy 1"
  );
});

/* profile */
bot.onText(/\/profile/, (msg) => {
  send(msg.chat.id, `User ID: ${msg.from.id}`);
});

module.exports = bot;