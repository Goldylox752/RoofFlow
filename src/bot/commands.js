module.exports = (bot) => {
  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      "🚀 Webhook Bot Online\n\nWelcome to production mode!"
    );
  });

  bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, "Commands: /start /help");
  });

  bot.on("message", (msg) => {
    if (!msg.text || msg.text.startsWith("/")) return;

    console.log(`[USER ${msg.from.id}] ${msg.text}`);

    bot.sendMessage(msg.chat.id, `You said: ${msg.text}`);
  });
};