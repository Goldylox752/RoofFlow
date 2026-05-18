export default async function handler(req, res) {
  try {
    const update = req.body;

    console.log("📩 Telegram update:", update);

    const chatId = update?.message?.chat?.id;
    const text = update?.message?.text;

    if (chatId && text) {
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
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ ok: true });
  }
}