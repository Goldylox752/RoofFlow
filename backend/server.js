require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const Stripe = require("stripe");
const supabase = require("./lib/supabase");

/* ===============================
   ENV VALIDATION (FAIL FAST)
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
    throw new Error(`❌ Missing env variable: ${key}`);
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
   APP + SERVICES INIT
=============================== */
const app = express();

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
  maxNetworkRetries: 3,
  timeout: 30000,
});

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

/* ===============================
   MIDDLEWARE
=============================== */
app.use("/stripe-webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));

/* ===============================
   SAFE TELEGRAM SEND
=============================== */
async function send(chatId, text) {
  try {
    if (!bot) return;
    await bot.sendMessage(chatId, text);
  } catch (err) {
    console.error("Telegram send error:", err.message);
  }
}

/* ===============================
   SUPABASE USER SERVICE
=============================== */
async function getOrCreateUser(tgUser) {
  if (!tgUser?.id) throw new Error("Invalid Telegram user");

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

const isPro = (user) => user?.plan === "pro";

/* ===============================
   IDEMPOTENCY HANDLERS
=============================== */
async function isEventProcessed(eventId) {
  const { data } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  return !!data;
}

async function markEvent(eventId, payload) {
  await supabase.from("stripe_events").upsert({
    id: eventId,
    ...payload,
    updated_at: new Date().toISOString(),
  });
}

/* ===============================
   TELEGRAM BOT COMMANDS
=============================== */
if (bot) {
  bot.setMyCommands([
    { command: "start", description: "Start bot" },
    { command: "plan", description: "View plan status" },
    { command: "profile", description: "View profile" },
    { command: "upgrade", description: "Upgrade to PRO" },
  ]);

  bot.onText(/\/start/, async (msg) => {
    try {
      const user = await getOrCreateUser(msg.from);

      await send(
        msg.chat.id,
        `👋 Welcome @${user.username}\nPlan: ${user.plan}`
      );

      setTimeout(async () => {
        const latest = await getOrCreateUser(msg.from);

        if (!isPro(latest)) {
          await send(
            msg.chat.id,
            "⚡ Upgrade to PRO for faster access & priority results."
          );
        }
      }, 30000);
    } catch (err) {
      console.error("/start error:", err);
    }
  });

  bot.onText(/\/profile/, async (msg) => {
    try {
      const user = await getOrCreateUser(msg.from);

      await send(
        msg.chat.id,
        `📌 PROFILE\nID: ${user.telegram_id}\nUser: ${user.username}\nPlan: ${user.plan}`
      );
    } catch (err) {
      console.error("/profile error:", err);
    }
  });

  bot.onText(/\/plan/, async (msg) => {
    try {
      const user = await getOrCreateUser(msg.from);

      await send(
        msg.chat.id,
        `💳 PLAN STATUS: ${user.plan}

FREE:
- Limited access

PRO:
- Priority processing
- Faster results`
      );
    } catch (err) {
      console.error("/plan error:", err);
    }
  });

  /* ===============================
     UPGRADE FLOW (STRIPE)
  =============================== */
  bot.onText(/\/upgrade/, async (msg) => {
    try {
      const user = await getOrCreateUser(msg.from);

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

      await send(msg.chat.id, `💳 Complete payment:\n${session.url}`);
    } catch (err) {
      console.error("Stripe error:", err);
      await send(msg.chat.id, "❌ Failed to create checkout session");
    }
  });
}

/* ===============================
   STRIPE WEBHOOK (PRODUCTION SAFE)
=============================== */
app.post("/stripe-webhook", async (req, res) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature error:", err.message);
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
      const telegramId = Number(session.metadata?.telegramId);

      if (!telegramId) throw new Error("Missing telegramId");

      await supabase
        .from("users")
        .update({
          plan: "pro",
          subscription_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("telegram_id", telegramId);

      await send(telegramId, "🎉 PRO ACTIVATED — welcome to premium access");
    }

    await markEvent(event.id, { status: "completed" });

    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook processing error:", err);

    if (event?.id) {
      await markEvent(event.id, {
        status: "failed",
        error: err.message,
      });
    }

    return res.sendStatus(500);
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