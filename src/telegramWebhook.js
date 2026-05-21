import { dispatchLead } from "../../call-center/dispatch";

export default async function handler(req, res) {
  try {
    // -----------------------------------
    // 1. ALWAYS ACK IMMEDIATELY
    // -----------------------------------
    res.status(200).json({ ok: true });

    const update = req.body;
    if (!update) return;

    // -----------------------------------
    // 2. NON-BLOCKING PROCESSING
    // -----------------------------------
    setImmediate(async () => {
      try {
        console.log("📩 Telegram update received");

        const message = update?.message;
        if (!message?.text) return;

        const chatId = message.chat?.id;
        const text = message.text.trim();

        if (!chatId || !text) return;

        // -----------------------------------
        // 3. BUILD LEAD (STANDARD FORMAT)
        // -----------------------------------
        const lead = {
          source: "telegram",
          chatId,
          text,
          user: {
            id: message.from?.id,
            username: message.from?.username,
            firstName: message.from?.first_name,
            lastName: message.from?.last_name,
          },
          metadata: {
            messageId: message.message_id,
            chatType: message.chat?.type,
            language: message.from?.language_code,
          },
          created_at: new Date().toISOString(),
        };

        // -----------------------------------
        // 4. DISPATCH TO YOUR SYSTEM
        // -----------------------------------
        const result = await dispatchLead(lead);

        const confirmationId =
          result?.leadId ?? `TG-${message.message_id}`;

        // -----------------------------------
        // 5. SEND TELEGRAM RESPONSE
        // -----------------------------------
        await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text:
                `Got it 👍 We'll be in touch shortly.\nReference: #${confirmationId}`,
            }),
          }
        );

        console.log(
          `[telegram] lead processed | user=${message.from?.id} ref=${confirmationId}`
        );
      } catch (err) {
        console.error("❌ Bot processing error:", err);
      }
    });
  } catch (err) {
    // NEVER break webhook
    console.error("Webhook crash:", err);
    return res.status(200).json({ ok: true });
  }
}