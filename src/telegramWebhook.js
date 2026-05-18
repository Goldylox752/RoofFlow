export default async function handler(req, res) {
  try {
    // -----------------------------------
    // 1. ALWAYS ACK TELEGRAM IMMEDIATELY
    // -----------------------------------
    res.status(200).json({ ok: true });

    // -----------------------------------
    // 2. PROCESS UPDATE ASYNC (NON-BLOCKING)
    // -----------------------------------
    const update = req.body;

    if (!update) return;

    // Run heavy logic AFTER response
    setImmediate(async () => {
      try {
        console.log("📩 Telegram update:", update);

        const message = update?.message;
        if (!message) return;

        const chatId = message?.chat?.id;
        const text = message?.text;

        if (!chatId || !text) return;

        // Send reply via Telegram API
        await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `You said: ${text}`,
            }),
          }
        );
      } catch (err) {
        console.error("Bot processing error:", err);
      }
    });

  } catch (err) {
    // NEVER break webhook for Telegram
    console.error("Webhook crash:", err);
    return res.status(200).json({ ok: true });
  }
}