const express = require("express");
const router = express.Router();

const { handleTelegramCommand } = require("../lib/telegramCommands");
const sendTelegram = require("../lib/sendTelegram");

router.post("/", async (req, res) => {
  try {
    const message = req.body?.message?.text;
    const chatId = req.body?.message?.chat?.id;

    if (!message) return res.sendStatus(200);

    const response = await handleTelegramCommand(message);

    await sendTelegram(response, chatId);

    res.sendStatus(200);
  } catch (err) {
    console.error("Telegram webhook error:", err);
    res.sendStatus(200);
  }
});

module.exports = router;