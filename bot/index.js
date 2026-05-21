const bot = require("./client");
const twilio = require("twilio");
const { dispatchLead } = require("../../call-center/dispatch");

/* =======================
   TWILIO CLIENT
======================= */
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* =======================
   FEATURE FLAGS
======================= */
const ENABLE_AI_RESPONSES =
  process.env.ENABLE_AI_RESPONSES === "true";

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
   LEAD BUILDERS
======================= */
function buildLead({ source, chatId, text, user, metadata }) {
  return {
    source,
    chatId,
    text: text?.trim(),
    user,
    metadata,
    created_at: new Date().toISOString(),
  };
}

/* =======================
   AI RESPONDER (OPTIONAL HOOK)
   - plug OpenAI here later
======================= */
async function getAIResponse(messageText, source) {
  if (!ENABLE_AI_RESPONSES) return null;

  try {
    // Placeholder (you can plug OpenAI here)
    // return openai.chat.completions.create(...)
    return `Got it — I understand your request about: "${messageText}". We’ll follow up shortly.`;
  } catch (err) {
    console.error("AI responder error:", err);
    return null;
  }
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

  const lead = buildLead({
    source: "telegram",
    chatId: msg.chat.id,
    text: msg.text,
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
  });

  const result = await dispatchLead(lead);
  const confirmationId = result?.leadId ?? `TG-${msg.message_id}`;

  /* =======================
     AI RESPONSE (OPTIONAL)
  ======================= */
  const aiReply = await getAIResponse(msg.text, "telegram");

  await bot.sendMessage(
    msg.chat.id,
    aiReply
      ? aiReply + `\n\nRef: #${confirmationId}`
      : `Got it 👍 We'll be in touch shortly.\nReference: #${confirmationId}`
  );

  console.log(`[telegram] lead dispatched | user=${userId}`);
}

/* =======================
   WHATSAPP HANDLER
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

  const lead = buildLead({
    source: "whatsapp",
    chatId: body.From,
    text: body.Body,
    user: {
      phone: body.From,
      profileName: body.ProfileName,
    },
    metadata: {
      messageSid: body.MessageSid,
    },
  });

  const result = await dispatchLead(lead);
  const confirmationId = result?.leadId ?? `WA-${body.MessageSid}`;

  /* =======================
     AI RESPONSE (OPTIONAL)
  ======================= */
  const aiReply = await getAIResponse(body.Body, "whatsapp");

  const twiml = new twilio.twiml.MessagingResponse();

  twiml.message(
    aiReply
      ? aiReply + `\nRef: #${confirmationId}`
      : `Got it 👍 We'll be in touch shortly.\nReference: #${confirmationId}`
  );

  console.log(`[whatsapp] lead dispatched | user=${userId}`);

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
      bot.sendMessage(msg.chat.id, "Something went wrong. Please try again.");
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