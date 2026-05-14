const express = require("express");
const router = express.Router();

const { handleTelegramCommand } = require("../lib/telegramCommands");
const sendTelegram = require("../lib/sendTelegram");

/* ===============================
   TELEGRAM WEBHOOK ROUTE
   - SAFE FOR WEBHOOK RETRIES
   - NEVER FAILS WITH NON-200 (Telegram requirement)
=============================== */
router.post("/", async (req, res) => {
  try {
    const update = req.body;

    const message = update?.message?.text;
    const chatId = update?.message?.chat?.id;

    /*
      Telegram may send many update types:
      - message
      - edited_message
      - callback_query
      - channel_post
    */

    if (!message || !chatId) {
      return res.sendStatus(200);
    }

    const response = await handleTelegramCommand(message, {
      chatId,
      update,
    });

    if (response) {
      await sendTelegram(response, chatId);
    }

    return res.sendStatus(200);

  } catch (err) {
    console.error("Telegram webhook error:", err);

    /*
      Always return 200 to prevent Telegram retry loops
      Log internally instead
    */
    return res.sendStatus(200);
  }
});

module.exports = router;