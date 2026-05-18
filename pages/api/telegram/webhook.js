export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // Telegram always sends POST
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    const update = req.body;

    console.log("📩 Telegram webhook received:", update);

    const message = update?.message;
    const chatId = message?.chat?.id;
    const text = message?.text;

    // Always respond OK even if no message
    if (!chatId) {
      return res.status(200).json({ ok: true });
    }

    let reply = "I didn't understand that.";

    if (text === "/start") {
      reply = "👋 Welcome! Your bot is live on Vercel.";
    } else if (text) {
      reply = `You said: ${text}`;
    }

    const telegramRes = await fetch(
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

    const data = await telegramRes.json();
    console.log("📤 Telegram response:", data);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);

    // IMPORTANT: never break Telegram webhook
    return res.status(200).json({ ok: true });
  }
}