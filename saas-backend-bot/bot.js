require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const Stripe = require("stripe");

/* ===============================
   ENV SAFETY
=============================== */
const REQUIRED = [
  "TELEGRAM_BOT_TOKEN",
  "STRIPE_SECRET_KEY",
  "CLIENT_URL",
];

for (const key of REQUIRED) {
  if (!process.env[key]) throw new Error(`Missing env: ${key}`);
}

const {
  TELEGRAM_BOT_TOKEN,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  CLIENT_URL,
  PORT = 3000,
} = process.env;

/* ===============================
   INIT
=============================== */
const app = express();

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
  maxNetworkRetries: 3,
});

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

/* ===============================
   MEMORY STORE (MVP DB)
=============================== */
const store = {
  users: new Map(),
  leads: new Map(),
  locks: new Map(),
  purchases: new Map(),
};

/* ===============================
   USER SERVICE
=============================== */
function getUser(tgUser) {
  const id = tgUser.id;

  if (!store.users.has(id)) {
    store.users.set(id, {
      id,
      username: tgUser.username || "unknown",
      createdAt: Date.now(),
    });
  }

  return store.users.get(id);
}

/* ===============================
   LEAD LOCK SYSTEM (CRITICAL UPGRADE)
=============================== */
function lockLead(leadId, userId) {
  const lead = store.leads.get(leadId);
  if (!lead) return null;

  if (lead.status !== "available") return null;

  lead.status = "locked";
  lead.lockedBy = userId;
  lead.lockedAt = Date.now();
  lead.lockExpires = Date.now() + 10 * 60 * 1000;

  store.locks.set(leadId, userId);

  return lead;
}

/* ===============================
   LEAD CREATION
=============================== */
function createLead(data) {
  const id = `lead_${Date.now()}`;

  const lead = {
    id,
    name: data.name,
    phone: data.phone,
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
   BROADCAST SYSTEM
=============================== */
function broadcastLead(lead) {
  const msg =
`🔥 NEW LEAD

📍 City: ${lead.city}
🏷 Category: ${lead.category}
⭐ Score: ${lead.score}
💰 Price: $${lead.price}

BUY:
${CLIENT_URL}/buy/${lead.id}`;

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
            name: `Lead - ${lead.city}`,
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
   TELEGRAM COMMANDS
=============================== */
bot.setMyCommands([
  { command: "start", description: "Start bot" },
  { command: "leads", description: "View leads" },
  { command: "add", description: "Add test lead" },
]);

/* ===============================
   START
=============================== */
bot.onText(/\/start/, (msg) => {
  const user = getUser(msg.from);

  bot.sendMessage(
    msg.chat.id,
`Welcome ${user.username}

🔥 Lead Marketplace Active
Buy verified leads instantly using /leads`
  );
});

/* ===============================
   LIST LEADS
=============================== */
bot.onText(/\/leads/, (msg) => {
  const leads = [...store.leads.values()]
    .filter(l => l.status === "available")
    .slice(-10);

  if (!leads.length) {
    return bot.sendMessage(msg.chat.id, "No leads available");
  }

  const text = leads.map(l =>
`ID: ${l.id}
📍 ${l.city}
🏷 ${l.category}
⭐ ${l.score}
💰 $${l.price}
`).join("\n----------------\n");

  bot.sendMessage(msg.chat.id, text);
});

/* ===============================
   ADD TEST LEAD
=============================== */
bot.onText(/\/add/, (msg) => {
  const lead = createLead({
    name: "Test Lead",
    phone: "hidden",
    city: "Calgary",
    category: "roofing",
    price: 29,
    score: 82,
  });

  bot.sendMessage(msg.chat.id, `Created: ${lead.id}`);
});

/* ===============================
   BUY FLOW (CORE MONEY ENTRY)
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
    return bot.sendMessage(msg.chat.id, "Lead already taken");
  }

  try {
    const session = await createCheckout(lead, user.id);

    bot.sendMessage(msg.chat.id, `💳 Pay here:\n${session.url}`);
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, "Payment error");
  }
});

/* ===============================
   STRIPE WEBHOOK
=============================== */
app.post("/stripe-webhook", express.raw({ type: "application/json" }), (req, res) => {
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

    const { leadId, userId } = session.metadata;

    const lead = store.leads.get(leadId);

    if (lead) {
      lead.status = "sold";

      store.purchases.set(leadId, {
        leadId,
        userId,
        time: Date.now(),
      });

      bot.sendMessage(
        Number(userId),
        `🔥 LEAD DELIVERED

📍 ${lead.city}
🏷 ${lead.category}
⭐ ${lead.score}`
      );
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
   START SERVER
=============================== */
app.listen(PORT, () => {
  console.log(`🚀 Lead Marketplace running on ${PORT}`);
});