const bot = require("./client");
const { dispatchLead } = require("../../call-center/dispatch");

/* ===============================
   BOOTSTRAP TELEGRAM SYSTEM
=============================== */
function bootstrapTelegram() {
  console.log("[telegram] booting");

  // MAIN ENTRY POINT → CALL CENTER
  bot.on("message", async (msg) => {
    try {
      const lead = {
        source: "telegram",
        chatId: msg.chat.id,
        text: msg.text,
        user: msg.from,
        created_at: new Date(),
      };

      const result = await dispatchLead(lead);

      if (result?.success) {
        bot.sendMessage(msg.chat.id, "Processed successfully");
      } else {
        bot.sendMessage(msg.chat.id, "Could not process request");
      }

    } catch (err) {
      console.error("[telegram] handler error", err);
      bot.sendMessage(msg.chat.id, "System error");
    }
  });

  console.log("[telegram] ready");
}

module.exports = bootstrapTelegram;