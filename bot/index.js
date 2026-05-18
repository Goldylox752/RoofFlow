const bot = require("./client");
const { dispatchLead } = require("../../call-center/dispatch");

const userCooldowns = new Map();
const COOLDOWN_MS = 3000;

function isRateLimited(userId) {
  const now = Date.now();
  const last = userCooldowns.get(userId);
  if (last && now - last < COOLDOWN_MS) return true;
  userCooldowns.set(userId, now);
  return false;
}

function buildLead(msg) {
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

async function handleMessage(msg) {
  if (!msg.text) return;

  const userId = msg.from?.id;

  if (isRateLimited(userId)) {
    return bot.sendMessage(msg.chat.id, "Please slow down. Try again in a moment.");
  }

  const lead = buildLead(msg);

  const result = await dispatchLead(lead);

  const confirmationId = result?.leadId ?? `TG-${msg.message_id}`;
  await bot.sendMessage(
    msg.chat.id,
    `Got it! We'll be in touch shortly.\nReference: #${confirmationId}`
  );

  console.log(`[telegram] lead dispatched | user=${userId} ref=${confirmationId}`);
}

function bootstrapTelegram() {
  console.log("[telegram] booting...");

  bot.on("message", async (msg) => {
    try {
      await handleMessage(msg);
    } catch (err) {
      console.error("[telegram] handler error", err);
      bot.sendMessage(msg.chat.id, "Something went wrong. Please try again.");
    }
  });

  console.log("[telegram] ready");
}

module.exports = bootstrapTelegram;
