// src/app/api/telegram/webhook/route.js

export async function POST(req) {
  try {
    const update = await req.json();

    const chatId = update?.message?.chat?.id;
    const text = update?.message?.text;

    if (!chatId) {
      return Response.json({ ok: true });
    }

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text ? `You said: ${text}` : "Bot active",
        }),
      }
    );

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);

    // NEVER fail webhook (prevents Telegram retry loop)
    return Response.json({ ok: true });
  }
}