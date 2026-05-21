const bot = require("./client");
const twilio = require("twilio");
const { dispatchLead } = require("../../call-center/dispatch");

/* =======================
   WHATSAPP (TWILIO CLIENT)
======================= */
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* =======================
   COOLDOWNS
======================= */
const userCooldowns = new Map();
const COOLDOWN_MS = 3000;

function isRateLimited(userId) {
  const now = Date.now();
  const last = userCooldowns.get(userId);

  if (last && now - last < COOLDOWN_MS) return true;

  userCooldowns.set(userId, now);
  return false;
}

/* =======================
   TELEGRAM LEAD FORMAT
======================= */
function buildTelegramLead(msg) {
  return {
    source: "telegram",
    chatId: msg.chat.id,
    text: msg.text.trim(),
    user: {
      id: msg.from?.id,
      username: msg.from?.username,
      firstName: msg.from?.first_name,
      lastName: msg.from?.last_name,
    },
    metadata: {
      chatType: msg.chat.type,
      language: msg.from?.language_code,
      messageId: msg.message_id,
    },
    created_at: new Date().toISOString(),
  };
}

/* =======================
   WHATSAPP LEAD FORMAT
======================= */
function buildWhatsAppLead(body) {
  return {
    source: "whatsapp",
    chatId: body.From,
    text: body.Body?.trim(),
    user: {
      phone: body.From,
      profileName: body.ProfileName,
    },
    metadata: {
      messageSid: body.MessageSid,
    },
    created_at: new Date().toISOString(),
  };
}

/* =======================
   TELEGRAM HANDLER
======================= */
async function handleTelegramMessage(msg) {
  if (!msg.text) return;

  const userId = msg.from?.id;

  if (isRateLimited(userId)) {
    return bot.sendMessage(
      msg.chat.id,
      "Please slow down. Try again in a moment."
    );
  }

  const lead = buildTelegramLead(msg);

  const result = await dispatchLead(lead);
  const confirmationId = result?.leadId ?? `TG-${msg.message_id}`;

  await bot.sendMessage(
    msg.chat.id,
    `Got it! We'll be in touch shortly.\nReference: #${confirmationId}`
  );

  console.log(
    `[telegram] lead dispatched | user=${userId} ref=${confirmationId}`
  );
}

/* =======================
   WHATSAPP HANDLER (TWILIO WEBHOOK)
======================= */
async function handleWhatsAppMessage(body, res) {
  const userId = body.From;

  if (!body.Body) return res.sendStatus(200);

  if (isRateLimited(userId)) {
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Please slow down. Try again shortly.");

    res.set("Content-Type", "text/xml");
    return res.send(twiml.toString());
  }

  const lead = buildWhatsAppLead(body);

  const result = await dispatchLead(lead);
  const confirmationId = result?.leadId ?? `WA-${body.MessageSid}`;

  const twiml = new twilio.twiml.MessagingResponse();

  twiml.message(
    `Got it 👍 We'll be in touch shortly.\nReference: #${confirmationId}`
  );

  console.log(
    `[whatsapp] lead dispatched | user=${userId} ref=${confirmationId}`
  );

  res.set("Content-Type", "text/xml");
  return res.send(twiml.toString());
}

/* =======================
   TELEGRAM BOOTSTRAP
======================= */
function bootstrapTelegram() {
  console.log("[telegram] booting...");

  bot.on("message", async (msg) => {
    try {
      await handleTelegramMessage(msg);
    } catch (err) {
      console.error("[telegram] handler error", err);
      bot.sendMessage(
        msg.chat.id,
        "Something went wrong. Please try again."
      );
    }
  });

  console.log("[telegram] ready");
}

/* =======================
   EXPORTS
======================= */
module.exports = {
  bootstrapTelegram,
  handleWhatsAppMessage,
};