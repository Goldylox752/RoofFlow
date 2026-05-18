export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // Telegram only sends POST requests
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    const update = req.body;

    console.log("📩 Telegram webhook received:", update);

    const chatId = update?.message?.chat?.id;
    const text = update?.message?.text;

    if (!chatId) {
      return res.status(200).json({ ok: true });
    }

    let reply = "I didn't understand that.";

    if (text === "/start") {
      reply = "👋 Welcome! Your bot is live.";
    } else if (text) {
      reply = `You said: ${text}`;
    }

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply,
        }),
      }
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(200).json({ ok: true });
  }
}