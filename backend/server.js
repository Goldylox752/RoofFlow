require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const Stripe = require("stripe");
const supabase = require("./lib/supabase");

/* ===============================
   ENV GUARD (FAIL FAST)
=============================== */
const REQUIRED_ENV = [
  "TELEGRAM_BOT_TOKEN",
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_ID",
  "STRIPE_WEBHOOK_SECRET",
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
   TELEGRAM SAFE SEND
=============================== */
function send(chatId, text) {
  if (!bot) return;
  return bot.sendMessage(chatId, text);
}

/* ===============================
   USER SERVICE (SUPABASE)
=============================== */
async function getOrCreateUser(tgUser) {
  const { data: existing, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", tgUser.id)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing;

  const { data: created, error: createError } = await supabase
    .from("users")
    .insert({
      telegram_id: tgUser.id,
      username: tgUser.username || "unknown",
      plan: "free",
      subscription_status: "inactive",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) throw createError;

  return created;
}

const isPro = (u) => u?.plan === "pro";

/* ===============================
   IDEMPOTENCY LOCK (PREVENT DOUBLE PAYMENT UPGRADES)
=============================== */
async function isEventProcessed(sessionId) {
  const { data } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", sessionId)
    .maybeSingle();

  return !!data;
}

async function markEvent(sessionId, payload) {
  await supabase.from("stripe_events").upsert({
    id: sessionId,
    ...payload,
    updated_at: new Date().toISOString(),
  });
}

/* ===============================
   TELEGRAM COMMANDS
=============================== */
if (bot) {
  bot.setMyCommands([
    { command: "start", description: "Start bot" },
    { command: "plan", description: "View plan" },
    { command: "profile", description: "Profile" },
    { command: "upgrade", description: "Upgrade to PRO" },
  ]);

  bot.onText(/\/start/, async (msg) => {
    const user = await getOrCreateUser(msg.from);

    send(msg.chat.id, `👋 Welcome @${user.username}\nPlan: ${user.plan}`);

    setTimeout(async () => {
      const latest = await getOrCreateUser(msg.from);

      if (!isPro(latest)) {
        send(msg.chat.id, "⚡ Upgrade to PRO for faster access & priority results.");
      }
    }, 30000);
  });

  bot.onText(/\/profile/, async (msg) => {
    const user = await getOrCreateUser(msg.from);

    send(
      msg.chat.id,
      `📌 PROFILE
ID: ${user.telegram_id}
User: ${user.username}
Plan: ${user.plan}`
    );
  });

  bot.onText(/\/plan/, async (msg) => {
    const user = await getOrCreateUser(msg.from);

    send(
      msg.chat.id,
`💳 PLAN STATUS: ${user.plan}

FREE:
- Limited access

PRO:
- Priority processing
- Faster results`
    );
  });

  /* ===============================
     UPGRADE FLOW (STRIPE CHECKOUT)
  =============================== */
  bot.onText(/\/upgrade/, async (msg) => {
    if (!stripe) return send(msg.chat.id, "Payments not configured");

    const user = await getOrCreateUser(msg.from);

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
          telegramId: String(user.telegram_id),
        },
      });

      send(msg.chat.id, `💳 Complete payment:\n${session.url}`);
    } catch (err) {
      console.error("Stripe error:", err);
      send(msg.chat.id, "❌ Failed to create checkout session");
    }
  });
}

/* ===============================
   STRIPE WEBHOOK (PRODUCTION SAFE)
=============================== */
app.post("/stripe-webhook", async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return res.sendStatus(500);
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.sendStatus(400);
  }

  try {
    /* ===============================
       IDEMPOTENCY CHECK
    =============================== */
    if (await isEventProcessed(event.id)) {
      return res.json({ received: true, duplicate: true });
    }

    await markEvent(event.id, {
      type: event.type,
      status: "processing",
    });

    /* ===============================
       PAYMENT SUCCESS
    =============================== */
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const telegramId = Number(session.metadata.telegramId);

      await supabase
        .from("users")
        .update({
          plan: "pro",
          subscription_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("telegram_id", telegramId);

      send(telegramId, "🎉 PRO ACTIVATED — welcome to premium access");
    }

    await markEvent(event.id, {
      status: "completed",
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook processing error:", err);

    if (event?.id) {
      await markEvent(event.id, {
        status: "failed",
        error: err.message,
      });
    }

    res.sendStatus(500);
  }
});

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    services: {
      telegram: !!bot,
      stripe: !!stripe,
      supabase: true,
    },
  });
});

/* ===============================
   START SERVER
=============================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});