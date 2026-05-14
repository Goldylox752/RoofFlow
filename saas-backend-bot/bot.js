require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const Stripe = require("stripe");
const twilio = require("twilio");

/* ===============================
   ENV SAFETY
=============================== */
const REQUIRED = [
  "TELEGRAM_BOT_TOKEN",
  "STRIPE_SECRET_KEY",
  "CLIENT_URL",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
];

for (const key of REQUIRED) {
  if (!process.env[key]) throw new Error(`Missing env: ${key}`);
}

const {
  TELEGRAM_BOT_TOKEN,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  CLIENT_URL,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  PORT = 3000,
} = process.env;

/* ===============================
   INIT SERVICES
=============================== */
const app = express();

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
  maxNetworkRetries: 3,
});

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const twilioClient = twilio(
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN
);

/* ===============================
   MEMORY STORE (MVP)
=============================== */
const store = {
  users: new Map(),
  leads: new Map(),
  locks: new Map(),
  purchases: new Map(),
};

/* ===============================
   USER
=============================== */
function getUser(tgUser) {
  const id = tgUser.id;

  if (!store.users.has(id)) {
    store.users.set(id, {
      id,
      username: tgUser.username || "unknown",
      phone: null, // optional future upgrade
      createdAt: Date.now(),
      purchases: 0,
    });
  }

  return store.users.get(id);
}

/* ===============================
   LEADS
=============================== */
function createLead(data) {
  const id = `lead_${Date.now()}`;

  const lead = {
    id,
    city: data.city,
    category: data.category || "general",
    price: data.price || 25,
    score: data.score || 50,
    status: "available",
    createdAt: Date.now(),
  };

  store.leads.set(id, lead);
  broadcastLead(lead);

  return lead;
}

/* ===============================
   LOCK SYSTEM
=============================== */
function lockLead(leadId, userId) {
  const lead = store.leads.get(leadId);
  if (!lead || lead.status !== "available") return null;

  lead.status = "locked";
  lead.lockedBy = userId;
  lead.lockedAt = Date.now();
  lead.lockExpires = Date.now() + 10 * 60 * 1000;

  store.locks.set(leadId, userId);

  return lead;
}

/* ===============================
   BROADCAST
=============================== */
function broadcastLead(lead) {
  const msg = `
🔥 NEW LEAD

📍 ${lead.city}
🏷 ${lead.category}
⭐ ${lead.score}
💰 $${lead.price}

BUY:
/buy ${lead.id}
  `.trim();

  for (const user of store.users.values()) {
    bot.sendMessage(user.id, msg);
  }
}

/* ===============================
   STRIPE CHECKOUT
=============================== */
async function createCheckout(lead, userId) {
  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Lead ${lead.city}`,
            description: lead.category,
          },
          unit_amount: lead.price * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      leadId: lead.id,
      userId: String(userId),
    },
    success_url: `${CLIENT_URL}/success`,
    cancel_url: `${CLIENT_URL}/cancel`,
  });
}

/* ===============================
   TWILIO SMS DELIVERY (NEW)
=============================== */
async function sendSMS(userPhone, message) {
  if (!userPhone) return;

  try {
    await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: userPhone,
    });
  } catch (err) {
    console.error("Twilio error:", err.message);
  }
}

/* ===============================
   TELEGRAM COMMANDS
=============================== */
bot.setMyCommands([
  { command: "start", description: "Start bot" },
  { command: "leads", description: "View leads" },
  { command: "add", description: "Test lead" },
  { command: "buy", description: "Buy lead" },
]);

bot.onText(/\/start/, (msg) => {
  const user = getUser(msg.from);

  bot.sendMessage(
    msg.chat.id,
`Welcome ${user.username}

🔥 Lead Marketplace Active`
  );
});

/* ===============================
   LEADS LIST
=============================== */
bot.onText(/\/leads/, (msg) => {
  const leads = [...store.leads.values()]
    .filter(l => l.status === "available")
    .slice(-10);

  if (!leads.length) {
    return bot.sendMessage(msg.chat.id, "No leads available");
  }

  bot.sendMessage(
    msg.chat.id,
    leads.map(l =>
`ID: ${l.id}
📍 ${l.city}
🏷 ${l.category}
💰 $${l.price}`
    ).join("\n\n---\n")
  );
});

/* ===============================
   ADD TEST LEAD
=============================== */
bot.onText(/\/add/, (msg) => {
  const lead = createLead({
    city: "Calgary",
    category: "roofing",
    price: 29,
    score: 85,
  });

  bot.sendMessage(msg.chat.id, `Created ${lead.id}`);
});

/* ===============================
   BUY FLOW
=============================== */
bot.onText(/\/buy (.+)/, async (msg, match) => {
  const user = getUser(msg.from);
  const leadId = match[1];

  const lead = store.leads.get(leadId);

  if (!lead) {
    return bot.sendMessage(msg.chat.id, "Lead not found");
  }

  const locked = lockLead(leadId, user.id);

  if (!locked) {
    return bot.sendMessage(msg.chat.id, "Already taken");
  }

  const session = await createCheckout(lead, user.id);

  bot.sendMessage(msg.chat.id, `Pay here:\n${session.url}`);
});

/* ===============================
   STRIPE WEBHOOK + TWILIO DELIVERY
=============================== */
app.post("/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
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
    const { leadId, userId } = session.metadata;

    const lead = store.leads.get(leadId);

    if (lead) {
      lead.status = "sold";

      const user = store.users.get(Number(userId));
      if (user) user.purchases += 1;

      const message = `
🔥 LEAD DELIVERED

📍 ${lead.city}
🏷 ${lead.category}
⭐ ${lead.score}
      `.trim();

      // Telegram delivery
      bot.sendMessage(Number(userId), message);

      // NEW: Twilio SMS delivery
      if (user?.phone) {
        await sendSMS(user.phone, message);
      }
    }
  }

  res.sendStatus(200);
});

/* ===============================
   HEALTH
=============================== */
app.get("/health", (req, res) => {
  res.json({
    leads: store.leads.size,
    users: store.users.size,
    sold: [...store.leads.values()].filter(l => l.status === "sold").length,
  });
});

/* ===============================
   START
=============================== */
app.listen(PORT, () => {
  console.log(`🚀 Lead SaaS + Twilio running on ${PORT}`);
});