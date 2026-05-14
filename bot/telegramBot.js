require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const clerkClient = require("../lib/clerk");

const {
  getLeads,
  upgradeUser,
} = require("../services/userService");

/* ===============================
   ENV VALIDATION
=============================== */

const REQUIRED_ENV = [
  "TELEGRAM_BOT_TOKEN",
  "CLERK_SECRET_KEY",
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing env: ${key}`);
  }
}

/* ===============================
   BOT INIT
=============================== */

const bot = new TelegramBot(
  process.env.TELEGRAM_BOT_TOKEN,
  {
    polling: true,
  }
);

console.log("✅ Telegram bot running with Clerk");

/* ===============================
   HELPERS
=============================== */

async function getClerkUserByTelegram(msg) {
  const telegramId = String(msg.from.id);

  const users = await clerkClient.users.getUserList({
    externalId: [telegramId],
  });

  return users.data[0];
}

async function requireUser(msg) {
  const user = await getClerkUserByTelegram(msg);

  if (!user) {
    await bot.sendMessage(
      msg.chat.id,
      "❌ No Clerk account linked.\nPlease sign in to the app first."
    );

    return null;
  }

  return user;
}

/* ===============================
   START
=============================== */

bot.onText(/\/start/, async (msg) => {
  try {
    const telegramId = String(msg.from.id);

    let user = await getClerkUserByTelegram(msg);

    /* ===============================
       AUTO CREATE USER
    ================================ */

    if (!user) {
      user = await clerkClient.users.createUser({
        externalId: telegramId,

        username: msg.from.username,

        firstName: msg.from.first_name,

        lastName: msg.from.last_name,
      });
    }

    await bot.sendMessage(
      msg.chat.id,
      `
🚀 Welcome ${user.username || "User"}

🪪 Clerk User ID:
${user.id}

Telegram linked successfully.
`
    );

  } catch (error) {
    console.error(error);

    bot.sendMessage(
      msg.chat.id,
      "⚠️ Failed to initialize account."
    );
  }
});

/* ===============================
   PROFILE
=============================== */

bot.onText(/\/profile/, async (msg) => {
  try {
    const user = await requireUser(msg);

    if (!user) return;

    await bot.sendMessage(
      msg.chat.id,
      `
👤 Profile

ID: ${user.id}
Username: ${user.username || "N/A"}

First Name:
${user.firstName || "N/A"}

Last Name:
${user.lastName || "N/A"}
`
    );

  } catch (error) {
    console.error(error);

    bot.sendMessage(
      msg.chat.id,
      "⚠️ Failed to fetch profile."
    );
  }
});

/* ===============================
   LEADS
=============================== */

bot.onText(/\/leads/, async (msg) => {
  try {
    const user = await requireUser(msg);

    if (!user) return;

    const leads = await getLeads(5);

    if (!leads?.length) {
      return bot.sendMessage(
        msg.chat.id,
        "No leads available."
      );
    }

    const text = leads
      .map(
        (lead) => `
🏠 ${lead.name || "No Name"}
📍 ${lead.city || "Unknown"}
💰 $${lead.price || 0}
`
      )
      .join("\n────────────\n");

    await bot.sendMessage(
      msg.chat.id,
      `📈 Latest Leads\n${text}`
    );

  } catch (error) {
    console.error(error);

    bot.sendMessage(
      msg.chat.id,
      "⚠️ Failed to fetch leads."
    );
  }
});

/* ===============================
   UPGRADE
=============================== */

bot.onText(/\/upgrade/, async (msg) => {
  try {
    const user = await requireUser(msg);

    if (!user) return;

    await upgradeUser(user.id);

    await bot.sendMessage(
      msg.chat.id,
      "✅ PRO upgrade complete"
    );

  } catch (error) {
    console.error(error);

    bot.sendMessage(
      msg.chat.id,
      "⚠️ Upgrade failed."
    );
  }
});

/* ===============================
   ERRORS
=============================== */

bot.on("polling_error", (error) => {
  console.error("Polling Error:", error.message);
});

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

module.exports = bot;