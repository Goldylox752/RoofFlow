export async function POST(req) {
  const update = await req.json();

  const chatId = update?.message?.chat?.id;
  const text = update?.message?.text;

  if (chatId) {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text ? `You said: ${text}` : "Bot active",
      }),
    });
  }

  return Response.json({ ok: true });
}