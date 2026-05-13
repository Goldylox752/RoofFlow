require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const Stripe = require("stripe");

/* ===============================
   ENV
=============================== */
const {
  TELEGRAM_BOT_TOKEN,
  WEBHOOK_URL,
  STRIPE_SECRET_KEY,
  STRIPE_PRICE_ID,
  STRIPE_WEBHOOK_SECRET,
  CLIENT_URL,
  PORT = 3000,
} = process.env;

if (!TELEGRAM_BOT_TOKEN || !WEBHOOK_URL || !STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
  throw new Error("Missing required environment variables");
}

/* ===============================
   INIT SERVICES
=============================== */
const app = express();

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
  maxNetworkRetries: 2,
  timeout: 30000,
});

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

/* ===============================
   MIDDLEWARE ORDER (IMPORTANT)
=============================== */
app.use("/stripe-webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));

/* ===============================
   WEBHOOK PATHS
=============================== */
const TELEGRAM_WEBHOOK_PATH = "/telegram-webhook";
const TELEGRAM_WEBHOOK_URL = `${WEBHOOK_URL}${TELEGRAM_WEBHOOK_PATH}`;

/* ===============================
   DB (IN MEMORY FOR NOW)
=============================== */
const users = new Map();

function getUser(tgUser) {
  let user = users.get(tgUser.id);

  if (!user) {
    user = {
      telegramId: tgUser.id,
      username: tgUser.username || "unknown",
      plan: "free",
      stripeSessionId: null,
      createdAt: Date.now(),
    };

    users.set(tgUser.id, user);
  }

  return user;
}

const isPro = (user) => user.plan === "pro";

/* ===============================
   TELEGRAM MENU
=============================== */
bot.setMyCommands([
  { command: "start", description: "Start bot" },
  { command: "profile", description: "View profile" },
  { command: "plan", description: "View plan" },
  { command: "upgrade", description: "Upgrade to PRO" },
  { command: "help", description: "Help menu" },
]);

/* ===============================
   SET TELEGRAM WEBHOOK
=============================== */
(async () => {
  try {
    await bot.setWebHook(TELEGRAM_WEBHOOK_URL);
    console.log("Telegram webhook set:", TELEGRAM_WEBHOOK_URL);
  } catch (err) {
    console.error("Webhook setup failed:", err);
  }
})();

/* ===============================
   🔥 HIGH-CONVERTING UPGRADE MESSAGE
=============================== */
const upgradeMessage = (user) => `
🔥 PRO ACCESS UNLOCK

You are currently on the FREE plan.

FREE includes:
• Limited access
• Basic features only

━━━━━━━━━━━━━━

💎 PRO PLAN ($19/month)

With PRO you get:

⚡ Instant access (no delays)
🎯 Higher quality results
🔒 Priority system access
📈 Better opportunities first
🚀 Faster workflow

━━━━━━━━━━━━━━

Why upgrade?
Most users lose opportunities because they are too late.

PRO users go first.

👉 Upgrade instantly here:
${CLIENT_URL}/checkout?plan=pro
`;

/* ===============================
   COMMANDS
=============================== */
bot.onText(/\/start/, (msg) => {
  const user = getUser(msg.from);

  bot.sendMessage(msg.chat.id, upgradeMessage(user));
});

bot.onText(/\/profile/, (msg) => {
  const user = getUser(msg.from);

  bot.sendMessage(
    msg.chat.id,
`Profile
ID: ${user.telegramId}
Username: ${user.username}
Plan: ${user.plan}`
  );
});

bot.onText(/\/plan/, (msg) => {
  const user = getUser(msg.from);

  bot.sendMessage(
    msg.chat.id,
`Current Plan: ${user.plan}

FREE:
- Basic access

PRO:
- Priority access
- Instant features`
  );
});

/* ===============================
   STRIPE CHECKOUT
=============================== */
bot.onText(/\/upgrade/, async (msg) => {
  const user = getUser(msg.from);

  if (isPro(user)) {
    return bot.sendMessage(msg.chat.id, "You are already PRO.");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],

      success_url: `${CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/cancel`,

      metadata: {
        telegramId: String(user.telegramId),
      },
    });

    user.stripeSessionId = session.id;

    bot.sendMessage(
      msg.chat.id,
      `💳 Complete your upgrade:\n\n${session.url}`
    );
  } catch (err) {
    console.error("Stripe error:", err);
    bot.sendMessage(msg.chat.id, "Payment error. Try again later.");
  }
});

/* ===============================
   STRIPE WEBHOOK
=============================== */
app.post("/stripe-webhook", (req, res) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook error:", err.message);
    return res.sendStatus(400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const telegramId = Number(session.metadata.telegramId);

    const user = users.get(telegramId);

    if (user) {
      user.plan = "pro";

      bot.sendMessage(
        telegramId,
        "🎉 Payment successful — PRO activated instantly."
      );
    }
  }

  res.sendStatus(200);
});

/* ===============================
   TELEGRAM WEBHOOK ENDPOINT
=============================== */
app.post(TELEGRAM_WEBHOOK_PATH, (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("Telegram webhook error:", err);
    res.sendStatus(500);
  }
});

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/health", (req, res) => {
  const allUsers = Array.from(users.values());

  res.json({
    status: "ok",
    totalUsers: allUsers.length,
    proUsers: allUsers.filter((u) => u.plan === "pro").length,
  });
});

/* ===============================
   START SERVER
=============================== */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});