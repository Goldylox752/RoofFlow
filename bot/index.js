// communications/index.js
// NorthSky Communications Layer
// Telegram + WhatsApp + AI Routing + Lead Dispatch

"use strict";

/* =========================================
   IMPORTS
========================================= */
const bot = require("./client");
const twilio = require("twilio");

const {
  dispatchLead,
} = require("../../call-center/dispatch");

/* =========================================
   ENVIRONMENT VALIDATION
========================================= */
const requiredEnv = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN"
];

requiredEnv.forEach((key) => {

  if (!process.env[key]) {

    console.warn(
      `[env] Missing environment variable: ${key}`
    );

  }

});

/* =========================================
   TWILIO CLIENT
========================================= */
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* =========================================
   CONFIG
========================================= */
const CONFIG = {

  ENABLE_AI_RESPONSES:
    process.env.ENABLE_AI_RESPONSES === "true",

  COOLDOWN_MS:
    Number(process.env.MESSAGE_COOLDOWN_MS || 3000),

  MAX_MESSAGE_LENGTH: 2000,

  LOG_PREFIX: "[northsky-communications]"

};

/* =========================================
   IN-MEMORY RATE LIMITER
========================================= */
const userCooldowns = new Map();

function isRateLimited(userId) {

  if (!userId) return false;

  const now = Date.now();

  const lastSeen =
    userCooldowns.get(userId);

  if (
    lastSeen &&
    now - lastSeen < CONFIG.COOLDOWN_MS
  ) {
    return true;
  }

  userCooldowns.set(userId, now);

  return false;

}

/* =========================================
   LOGGER
========================================= */
function log(type, message, meta = {}) {

  console.log(
    `${CONFIG.LOG_PREFIX} ${type} | ${message}`,
    Object.keys(meta).length ? meta : ""
  );

}

function logError(type, error, meta = {}) {

  console.error(
    `${CONFIG.LOG_PREFIX} ${type}`,
    {
      message: error?.message,
      stack: error?.stack,
      ...meta
    }
  );

}

/* =========================================
   SANITIZATION
========================================= */
function sanitizeMessage(text = "") {

  return String(text)
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, CONFIG.MAX_MESSAGE_LENGTH);

}

/* =========================================
   LEAD FACTORY
========================================= */
function buildLead({
  source,
  chatId,
  text,
  user = {},
  metadata = {}
}) {

  return {

    source,

    chatId,

    text: sanitizeMessage(text),

    user,

    metadata,

    created_at: new Date().toISOString()

  };

}

/* =========================================
   AI RESPONSE ENGINE
========================================= */
async function getAIResponse({
  message,
  source
}) {

  if (!CONFIG.ENABLE_AI_RESPONSES) {
    return null;
  }

  try {

    // Plug OpenAI or Anthropic here later

    return (
      `Thanks for reaching out to NorthSky.\n\n` +
      `We received your ${source} request and a team member ` +
      `will follow up shortly regarding:\n"${message}"`
    );

  } catch (error) {

    logError(
      "[ai-response]",
      error,
      { source }
    );

    return null;

  }

}

/* =========================================
   RESPONSE BUILDERS
========================================= */
function buildConfirmation({
  aiReply,
  confirmationId
}) {

  if (aiReply) {

    return (
      `${aiReply}\n\n` +
      `Reference ID: #${confirmationId}`
    );

  }

  return (
    `Thanks — your request has been received.\n\n` +
    `Reference ID: #${confirmationId}\n` +
    `Our team will contact you shortly.`
  );

}

/* =========================================
   TELEGRAM HANDLER
========================================= */
async function handleTelegramMessage(msg) {

  try {

    if (!msg?.text) return;

    const userId =
      msg.from?.id;

    if (isRateLimited(userId)) {

      return bot.sendMessage(
        msg.chat.id,
        "You're sending messages too quickly. Please wait a moment."
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
        lastName: msg.from?.last_name
      },

      metadata: {
        chatType: msg.chat?.type,
        language: msg.from?.language_code,
        messageId: msg.message_id
      }

    });

    const result =
      await dispatchLead(lead);

    const confirmationId =
      result?.leadId ||
      `TG-${msg.message_id}`;

    const aiReply =
      await getAIResponse({
        message: msg.text,
        source: "telegram"
      });

    await bot.sendMessage(
      msg.chat.id,
      buildConfirmation({
        aiReply,
        confirmationId
      })
    );

    log(
      "[telegram]",
      "lead dispatched",
      {
        userId,
        confirmationId
      }
    );

  } catch (error) {

    logError(
      "[telegram-handler]",
      error
    );

    try {

      await bot.sendMessage(
        msg.chat.id,
        "Something went wrong while processing your request."
      );

    } catch (nestedError) {

      logError(
        "[telegram-reply]",
        nestedError
      );

    }

  }

}

/* =========================================
   WHATSAPP HANDLER
========================================= */
async function handleWhatsAppMessage(
  body,
  res
) {

  try {

    const userId =
      body?.From;

    const message =
      body?.Body;

    if (!message) {

      return res.sendStatus(200);

    }

    if (isRateLimited(userId)) {

      const twiml =
        new twilio.twiml.MessagingResponse();

      twiml.message(
        "You're sending messages too quickly. Please wait a moment."
      );

      res.set(
        "Content-Type",
        "text/xml"
      );

      return res.send(
        twiml.toString()
      );

    }

    const lead = buildLead({

      source: "whatsapp",

      chatId: body.From,

      text: message,

      user: {
        phone: body.From,
        profileName: body.ProfileName
      },

      metadata: {
        messageSid: body.MessageSid
      }

    });

    const result =
      await dispatchLead(lead);

    const confirmationId =
      result?.leadId ||
      `WA-${body.MessageSid}`;

    const aiReply =
      await getAIResponse({
        message,
        source: "whatsapp"
      });

    const twiml =
      new twilio.twiml.MessagingResponse();

    twiml.message(
      buildConfirmation({
        aiReply,
        confirmationId
      })
    );

    log(
      "[whatsapp]",
      "lead dispatched",
      {
        userId,
        confirmationId
      }
    );

    res.set(
      "Content-Type",
      "text/xml"
    );

    return res.send(
      twiml.toString()
    );

  } catch (error) {

    logError(
      "[whatsapp-handler]",
      error
    );

    const twiml =
      new twilio.twiml.MessagingResponse();

    twiml.message(
      "Something went wrong while processing your request."
    );

    res.set(
      "Content-Type",
      "text/xml"
    );

    return res.send(
      twiml.toString()
    );

  }

}

/* =========================================
   TELEGRAM BOOTSTRAP
========================================= */
function bootstrapTelegram() {

  log(
    "[telegram]",
    "booting"
  );

  bot.on(
    "message",
    async (msg) => {

      await handleTelegramMessage(msg);

    }
  );

  log(
    "[telegram]",
    "ready"
  );

}

/* =========================================
   HEALTHCHECK
========================================= */
function getCommunicationsHealth() {

  return {

    telegram: !!bot,

    twilio: !!twilioClient,

    aiResponses:
      CONFIG.ENABLE_AI_RESPONSES,

    uptime:
      process.uptime()

  };

}

/* =========================================
   EXPORTS
========================================= */
module.exports = {

  bootstrapTelegram,

  handleWhatsAppMessage,

  handleTelegramMessage,

  getCommunicationsHealth

};