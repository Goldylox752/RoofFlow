require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const Stripe = require("stripe");

/* ===============================
   ENV VALIDATION
=============================== */
const REQUIRED_ENV = [
  "TELEGRAM_BOT_TOKEN",
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_ID",
  "CLIENT_URL",
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing env: ${key}`);
  }
}

const {
  TELEGRAM_BOT_TOKEN,
  STRIPE_SECRET_KEY,
  STRIPE_PRICE_ID,
  STRIPE_WEBHOOK_SECRET,
  CLIENT_URL,
  PORT = 3000,
} = process.env;

/* ===============================
   APP + SERVICES
=============================== */
const app = express();

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
  maxNetworkRetries: 3,
  timeout: 30000,
});

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

/* ===============================
   MIDDLEWARE
=============================== */
app.use("/stripe-webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));

/* ===============================
   MEMORY STORE (MVP)
=============================== */
const store = {
  users: new Map(),
  timers: new Map(),
  state: new Map(),
};

/* ===============================
   USER CORE
=============================== */
function getUser(tgUser) {
  const id = tgUser.id;

  if (!store.users.has(id)) {
    store.users.set(id, {
      id,
      username: tgUser.username || "unknown",
      plan: "free",
      stripeSessionId: null,
      createdAt: Date.now(),
      lastActive: Date.now(),
    });
  }

  const user = store.users.get(id);
  user.lastActive = Date.now();

  return user;
}

const isPro = (u) => u?.plan === "pro";

/* ===============================
   HELPERS
=============================== */
function setState(id, value) {
  store.state.set(id, value);
}

function clearTimer(id) {
  const t = store.timers.get(id);
  if (t) clearTimeout(t);
  store.timers.delete(id);
}

function send(chatId, text) {
  return bot.sendMessage(chatId, text);
}

/* ===============================
   SALES ENGINE (CONVERSION MESSAGE)
=============================== */
function salesMessage(user) {
  return `
ACCESS READY

Hi @${user.username}

Current plan: FREE

FREE:
- Limited access
- Slower processing
- Lower priority

PRO — $19/month

BENEFITS:
- Priority access
- Faster results
- Higher conversion rate

Upgrade:
${CLIENT_URL}/checkout?plan=pro
`;
}

/* ===============================
   BOT MENU
=============================== */
bot.setMyCommands([
  { command: "start", description: "Start bot" },
  { command: "plan", description: "View plan" },
  { command: "profile", description: "Profile" },
  { command: "upgrade", description: "Upgrade" },
]);

/* ===============================
   START FLOW (FUNNEL)
=============================== */
bot.onText(/\/start/, (msg) => {
  const user = getUser(msg.from);

  setState(user.id, "started");

  send(msg.chat.id, salesMessage(user));

  clearTimer(user.id);

  // follow-up 1
  store.timers.set(
    user.id,
    setTimeout(() => {
      const latest = store.users.get(user.id);
      if (!isPro(latest)) {
        send(msg.chat.id, "Quick question: want faster access?");
      }
    }, 30000)
  );

  // follow-up 2
  store.timers.set(
    user.id,
    setTimeout(() => {
      const latest = store.users.get(user.id);
      if (!isPro(latest)) {
        send(msg.chat.id, `${CLIENT_URL}/checkout?plan=pro`);
      }
    }, 180000)
  );
});

/* ===============================
   PLAN
=============================== */
bot.onText(/\/plan/, (msg) => {
  const user = getUser(msg.from);

  send(
    msg.chat.id,
    `PLAN: ${user.plan.toUpperCase()}

FREE:
- Basic access

PRO:
- Priority processing`
  );
});

/* ===============================
   PROFILE
=============================== */
bot.onText(/\/profile/, (msg) => {
  const user = getUser(msg.from);

  send(
    msg.chat.id,
    `PROFILE
ID: ${user.id}
Username: ${user.username}
Plan: ${user.plan}`
  );
});

/* ===============================
   UPGRADE (STRIPE CHECKOUT)
=============================== */
bot.onText(/\/upgrade/, async (msg) => {
  const user = getUser(msg.from);

  if (isPro(user)) {
    return send(msg.chat.id, "Already on PRO");
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

    send(msg.chat.id, `Complete payment:\n${session.url}`);

    clearTimer(user.id);

    // abandoned checkout follow-up
    store.timers.set(
      user.id,
      setTimeout(() => {
        const latest = store.users.get(user.id);
        if (!isPro(latest)) {
          send(msg.chat.id, `Reminder:\n${session.url}`);
        }
      }, 600000)
    );
  } catch (err) {
    console.error("Stripe error:", err);
    send(msg.chat.id, "Payment error occurred");
  }
});

/* ===============================
   STRIPE WEBHOOK
=============================== */
app.post("/stripe-webhook", (req, res) => {
  if (!STRIPE_WEBHOOK_SECRET) return res.sendStatus(500);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return res.sendStatus(400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = Number(session.metadata.telegramId);

    const user = store.users.get(userId);

    if (user) {
      user.plan = "pro";
      setState(userId, "pro");

      clearTimer(userId);

      send(userId, "Payment confirmed. PRO activated.");
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
  const users = Array.from(store.users.values());

  res.json({
    status: "ok",
    totalUsers: users.length,
    proUsers: users.filter((u) => u.plan === "pro").length,
    uptime: process.uptime(),
  });
});

/* ===============================
   START SERVER
=============================== */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});