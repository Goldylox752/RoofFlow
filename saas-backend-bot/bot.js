require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const Stripe = require("stripe");

/* ===============================
   ENV VALIDATION
=============================== */
const requiredEnv = [
  "TELEGRAM_BOT_TOKEN",
  "WEBHOOK_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_ID",
  "CLIENT_URL",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing env: ${key}`);
  }
}

const {
  TELEGRAM_BOT_TOKEN,
  WEBHOOK_URL,
  STRIPE_SECRET_KEY,
  STRIPE_PRICE_ID,
  STRIPE_WEBHOOK_SECRET,
  CLIENT_URL,
  PORT = 3000,
} = process.env;

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
   MIDDLEWARE
=============================== */
app.use("/stripe-webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));

/* ===============================
   MEMORY STORE (replace with DB later)
=============================== */
const users = new Map();
const timers = new Map();
const state = new Map();

/* ===============================
   USER SYSTEM
=============================== */
function getUser(tgUser) {
  const id = tgUser.id;

  if (!users.has(id)) {
    users.set(id, {
      id,
      username: tgUser.username || "unknown",
      plan: "free",
      stripeSessionId: null,
      createdAt: Date.now(),
      lastActive: Date.now(),
    });
  }

  const user = users.get(id);
  user.lastActive = Date.now();

  return user;
}

const isPro = (user) => user.plan === "pro";

/* ===============================
   HELPERS
=============================== */
const setState = (id, value) => state.set(id, value);

const clearTimer = (id) => {
  const t = timers.get(id);
  if (t) clearTimeout(t);
};

/* ===============================
   SALES MESSAGE (OPTIMIZED CONVERSION)
=============================== */
function salesMessage(user) {
  return `
🔥 ACCESS READY

Hi @${user.username}

You're currently on the FREE plan.

━━━━━━━━━━━━━━
FREE:
• Limited access
• Lower priority
• Slower results
━━━━━━━━━━━━━━

💎 PRO — $19/month

UNLOCK:
⚡ Priority access
🎯 Better results first
🚀 Faster processing
📈 More opportunities

━━━━━━━━━━━━━━
WHY USERS UPGRADE:
They want faster results before others.

👉 Upgrade here:
${CLIENT_URL}/checkout?plan=pro
`;
}

/* ===============================
   TELEGRAM MENU
=============================== */
bot.setMyCommands([
  { command: "start", description: "Start bot" },
  { command: "plan", description: "View plan" },
  { command: "profile", description: "Profile" },
  { command: "upgrade", description: "Upgrade to PRO" },
]);

/* ===============================
   START FLOW + FOLLOW UPS
=============================== */
bot.onText(/\/start/, (msg) => {
  const user = getUser(msg.from);

  setState(user.id, "started");

  bot.sendMessage(msg.chat.id, salesMessage(user));

  clearTimer(user.id);

  /* FOLLOW UP 1 (30s) */
  timers.set(
    user.id,
    setTimeout(() => {
      if (!isPro(user)) {
        bot.sendMessage(
          user.id,
          "👀 Quick question:\n\nWant to see why PRO users get better results?"
        );
      }
    }, 30000)
  );

  /* FOLLOW UP 2 (3 min) */
  timers.set(
    user.id,
    setTimeout(() => {
      if (!isPro(user)) {
        bot.sendMessage(
          user.id,
          `Still thinking?\n\nMost users upgrade to avoid missing opportunities.\n\n👉 ${CLIENT_URL}/checkout?plan=pro`
        );
      }
    }, 180000)
  );
});

/* ===============================
   PLAN
=============================== */
bot.onText(/\/plan/, (msg) => {
  const user = getUser(msg.from);

  bot.sendMessage(
    msg.chat.id,
`PLAN STATUS: ${user.plan.toUpperCase()}

FREE:
• Basic access

PRO:
• Priority access
• Faster results`
  );
});

/* ===============================
   PROFILE
=============================== */
bot.onText(/\/profile/, (msg) => {
  const user = getUser(msg.from);

  bot.sendMessage(
    msg.chat.id,
`PROFILE
ID: ${user.id}
Username: ${user.username}
Plan: ${user.plan}`
  );
});

/* ===============================
   STRIPE CHECKOUT
=============================== */
bot.onText(/\/upgrade/, async (msg) => {
  const user = getUser(msg.from);

  if (isPro(user)) {
    return bot.sendMessage(msg.chat.id, "You already have PRO access.");
  }

  setState(user.id, "checkout_started");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],

      success_url: `${CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/cancel`,

      metadata: {
        telegramId: String(user.id),
      },
    });

    user.stripeSessionId = session.id;

    bot.sendMessage(msg.chat.id, `💳 Complete payment:\n\n${session.url}`);

    clearTimer(user.id);

    /* ABANDONMENT FOLLOW-UP (10 min) */
    timers.set(
      user.id,
      setTimeout(() => {
        if (!isPro(user)) {
          bot.sendMessage(
            user.id,
            `⏳ Your PRO access is still waiting.\n\n👉 ${session.url}`
          );
        }
      }, 600000)
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
    return res.sendStatus(400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = Number(session.metadata.telegramId);

    const user = users.get(userId);

    if (user) {
      user.plan = "pro";
      setState(userId, "pro");

      clearTimer(userId);

      bot.sendMessage(
        userId,
        "🎉 Payment confirmed — PRO activated instantly."
      );
    }
  }

  res.sendStatus(200);
});

/* ===============================
   TELEGRAM WEBHOOK
=============================== */
app.post("/telegram-webhook", (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/health", (req, res) => {
  const all = Array.from(users.values());

  res.json({
    status: "ok",
    users: all.length,
    proUsers: all.filter((u) => u.plan === "pro").length,
  });
});

/* ===============================
   START SERVER
=============================== */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});