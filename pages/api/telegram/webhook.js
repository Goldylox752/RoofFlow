export default async function handler(req, res) {
  // Telegram only sends POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const update = req.body;

    // Log incoming update (for debugging)
    console.log("📩 Telegram webhook received:", JSON.stringify(update, null, 2));

    const message = update.message;
    const chatId = message?.chat?.id;
    const text = message?.text;

    if (!chatId) {
      return res.status(200).json({ ok: true });
    }

    // Basic response logic
    let reply = "I didn't understand that.";

    if (text === "/start") {
      reply = "👋 Welcome! Your bot is live.";
    } else if (text) {
      reply = `You said: ${text}`;
    }

    // Send message back to Telegram
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: reply,
      }),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}