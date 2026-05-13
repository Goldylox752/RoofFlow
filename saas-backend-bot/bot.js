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
   INIT
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
   WEBHOOKS
=============================== */
const TG_PATH = "/telegram-webhook";
const TG_URL = `${WEBHOOK_URL}${TG_PATH}`;

/* ===============================
   IN-MEMORY USERS (replace with Supabase later)
=============================== */
const users = new Map();

function getUser(tgUser) {
  let user = users.get(tgUser.id);

  if (!user) {
    user = {
      id: tgUser.id,
      username: tgUser.username || "unknown",
      plan: "free",
      stripeSessionId: null,
      createdAt: Date.now(),
      lastActive: Date.now(),
    };

    users.set(tgUser.id, user);
  }

  user.lastActive = Date.now();
  return user;
}

const isPro = (u) => u.plan === "pro";

/* ===============================
   TELEGRAM MENU
=============================== */
bot.setMyCommands([
  { command: "start", description: "Start" },
  { command: "plan", description: "View plan" },
  { command: "profile", description: "Profile" },
  { command: "upgrade", description: "Upgrade to PRO" },
  { command: "help", description: "Help" },
]);

/* ===============================
   CONVERSION MESSAGE SYSTEM
=============================== */

function salesMessage(user) {
  return `
🔥 YOUR ACCOUNT IS ACTIVE

Hi @${user.username}

You are currently on the FREE plan.

━━━━━━━━━━━━━━
FREE LIMITS:
• Limited access
• Lower priority
• Basic results only
━━━━━━━━━━━━━━

💎 PRO PLAN — $19/month

UNLOCK EVERYTHING:
⚡ Instant priority access
🎯 Higher quality results first
🚀 Faster processing
🔒 Exclusive system access
📈 More opportunities per day

━━━━━━━━━━━━━━
WHY PEOPLE UPGRADE:
Users on PRO consistently get better results because they act first.

👉 Upgrade here:
${CLIENT_URL}/checkout?plan=pro
`;
}

/* ===============================
   TELEGRAM COMMANDS
=============================== */

bot.onText(/\/start/, (msg) => {
  const user = getUser(msg.from);

  bot.sendMessage(msg.chat.id, salesMessage(user));
});

bot.onText(/\/plan/, (msg) => {
  const user = getUser(msg.from);

  bot.sendMessage(
    msg.chat.id,
`PLAN STATUS

Current: ${user.plan.toUpperCase()}

FREE:
- Basic access

PRO:
- Priority system access
- Faster results
- Full features`
  );
});

bot.onText(/\/profile/, (msg) => {
  const user = getUser(msg.from);

  bot.sendMessage(
    msg.chat.id,
`PROFILE
ID: ${user.id}
User: ${user.username}
Plan: ${user.plan}`
  );
});

/* ===============================
   UPGRADE FLOW (STRIPE)
=============================== */

bot.onText(/\/upgrade/, async (msg) => {
  const user = getUser(msg.from);

  if (isPro(user)) {
    return bot.sendMessage(msg.chat.id, "You already have PRO access.");
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
        telegramId: String(user.id),
      },
    });

    user.stripeSessionId = session.id;

    bot.sendMessage(
      msg.chat.id,
      `💳 Complete your upgrade:

${session.url}`
    );
  } catch (err) {
    console.error("Stripe error:", err);
    bot.sendMessage(msg.chat.id, "Payment system error. Try again later.");
  }
});

/* ===============================
   STRIPE WEBHOOK (AUTO UPGRADE)
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
    console.error("Webhook failed:", err.message);
    return res.sendStatus(400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = Number(session.metadata.telegramId);

    const user = users.get(userId);

    if (user) {
      user.plan = "pro";

      bot.sendMessage(
        userId,
        "🎉 Payment confirmed — PRO activated instantly."
      );
    }
  }

  res.sendStatus(200);
});

/* ===============================
   TELEGRAM WEBHOOK ENDPOINT
=============================== */

app.post(TG_PATH, (req, res) => {
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
  const all = Array.from(users.values());

  res.json({
    status: "ok",
    users: all.length,
    proUsers: all.filter(u => u.plan === "pro").length,
  });
});

/* ===============================
   START SERVER
=============================== */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});