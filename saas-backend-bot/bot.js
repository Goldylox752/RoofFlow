require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const Stripe = require("stripe");
const twilio = require("twilio");

/* ===============================
   ENV VALIDATION
=============================== */
const REQUIRED = [
  "TELEGRAM_BOT_TOKEN",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
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
   INIT CORE SERVICES
=============================== */
const app = express();
app.use(express.json());

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
  maxNetworkRetries: 3,
});

const twilioClient = twilio(
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN
);

/* ===============================
   SIMPLE IN-MEMORY DATA LAYER
   (swap with Supabase later)
=============================== */
const db = {
  users: new Map(),
  leads: new Map(),
  funnels: new Map(), // AI sales pipeline state
};

/* ===============================
   USER FACTORY
=============================== */
function getUser(tgUser) {
  if (!db.users.has(tgUser.id)) {
    db.users.set(tgUser.id, {
      id: tgUser.id,
      username: tgUser.username || "unknown",
      phone: null,
      createdAt: Date.now(),
      totalDeals: 0,
    });
  }
  return db.users.get(tgUser.id);
}

/* ===============================
   SAFE TELEGRAM SENDER
=============================== */
const sendTG = async (chatId, text) => {
  try {
    await bot.sendMessage(chatId, text);
  } catch (err) {
    console.error("Telegram send error:", err.message);
  }
};

/* ===============================
   TWILIO LAYER (SMS + VOICE)
=============================== */
async function sendSMS(phone, text) {
  if (!phone) return;

  try {
    await twilioClient.messages.create({
      body: text,
      from: TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } catch (err) {
    console.error("SMS error:", err.message);
  }
}

async function sendVoice(phone, script) {
  if (!phone) return;

  try {
    await twilioClient.calls.create({
      to: phone,
      from: TWILIO_PHONE_NUMBER,
      twiml: `
        <Response>
          <Say voice="alice">${script}</Say>
        </Response>
      `,
    });
  } catch (err) {
    console.error("Voice error:", err.message);
  }
}

/* ===============================
   🧠 AI DECISION ENGINE (replaceable with GPT later)
=============================== */
function aiStep(stage, lead) {
  const steps = {
    NEW: {
      sms: `New ${lead.category} lead in ${lead.city}. Act now.`,
      voice: `New high value lead available in ${lead.city}.`,
      next: "FOLLOWUP_1",
    },
    FOLLOWUP_1: {
      sms: `Reminder: ${lead.category} lead still available.`,
      voice: `First reminder. Lead still waiting.`,
      next: "FOLLOWUP_2",
    },
    FOLLOWUP_2: {
      sms: `Final alert: lead may be reassigned soon.`,
      voice: `Final warning before reassignment.`,
      next: "CLOSE",
    },
  };

  return steps[stage] || null;
}

/* ===============================
   LEAD ENGINE
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

  db.leads.set(id, lead);
  broadcastLead(lead);

  return lead;
}

/* ===============================
   LEAD LOCKING
=============================== */
function lockLead(leadId, userId) {
  const lead = db.leads.get(leadId);
  if (!lead || lead.status !== "available") return null;

  lead.status = "locked";

  db.funnels.set(userId, {
    leadId,
    stage: "NEW",
    updatedAt: Date.now(),
  });

  return lead;
}

/* ===============================
   BROADCAST ENGINE
=============================== */
function broadcastLead(lead) {
  const msg = `
🔥 NEW AI VERIFIED LEAD

📍 ${lead.city}
🏷 ${lead.category}
⭐ Score: ${lead.score}/100
💰 $${lead.price}

/buy ${lead.id}
  `.trim();

  for (const user of db.users.values()) {
    sendTG(user.id, msg);
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
   🚀 AI FOLLOW-UP ENGINE (CORE SAAS FEATURE)
=============================== */
async function runFollowUp(user, lead, stage = "FOLLOWUP_1") {
  const step = aiStep(stage, lead);
  if (!step) return;

  const funnel = db.funnels.get(user.id);
  if (!funnel) return;

  funnel.stage = step.next;
  funnel.updatedAt = Date.now();

  await sendSMS(user.phone, step.sms);
  await sendVoice(user.phone, step.voice);

  const delay = stage === "FOLLOWUP_1"
    ? 5 * 60 * 1000
    : 15 * 60 * 1000;

  setTimeout(() => {
    if (funnel.stage !== "CLOSE") {
      runFollowUp(user, lead, step.next);
    }
  }, delay);
}

/* ===============================
   TELEGRAM COMMANDS
=============================== */
bot.setMyCommands([
  { command: "start", description: "AI Call Center" },
  { command: "leads", description: "View leads" },
  { command: "add", description: "Generate lead" },
  { command: "buy", description: "Purchase lead" },
  { command: "stats", description: "Analytics" },
]);

bot.onText(/\/start/, async (msg) => {
  const user = getUser(msg.from);

  await sendTG(msg.chat.id, `
Welcome ${user.username}

🤖 AI CALL CENTER ACTIVE
- Multi-channel outreach (SMS + Voice)
- Automated follow-up engine
- Sales pipeline tracking
  `);
});

/* ===============================
   LEADS
=============================== */
bot.onText(/\/leads/, async (msg) => {
  const leads = [...db.leads.values()]
    .filter(l => l.status === "available")
    .slice(-10);

  if (!leads.length) return sendTG(msg.chat.id, "No leads");

  await sendTG(
    msg.chat.id,
    leads.map(l =>
`ID: ${l.id}
📍 ${l.city}
🏷 ${l.category}
⭐ ${l.score}
💰 $${l.price}`
    ).join("\n\n---\n")
  );
});

/* ===============================
   ADD LEAD
=============================== */
bot.onText(/\/add/, (msg) => {
  const lead = createLead({
    city: "Calgary",
    category: "roofing",
    price: 29,
    score: 88,
  });

  sendTG(msg.chat.id, `Created: ${lead.id}`);
});

/* ===============================
   BUY FLOW
=============================== */
bot.onText(/\/buy (.+)/, async (msg, match) => {
  const user = getUser(msg.from);
  const lead = db.leads.get(match[1]);

  if (!lead) return sendTG(msg.chat.id, "Not found");

  const locked = lockLead(lead.id, user.id);
  if (!locked) return sendTG(msg.chat.id, "Already taken");

  const session = await createCheckout(lead, user.id);

  sendTG(msg.chat.id, `💳 Pay here:\n${session.url}`);
});

/* ===============================
   STRIPE WEBHOOK (SALES + AI TRIGGER)
=============================== */
app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
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
      const { leadId, userId } = event.data.object.metadata;

      const lead = db.leads.get(leadId);
      const user = db.users.get(Number(userId));

      if (!lead || !user) return res.sendStatus(200);

      lead.status = "sold";
      user.totalDeals++;

      await sendTG(user.id, `
🔥 DEAL CLOSED

📍 ${lead.city}
🏷 ${lead.category}
⭐ ${lead.score}
      `);

      if (user.phone) {
        await sendSMS(user.phone, "Deal closed. AI system activating follow-ups.");
        await sendVoice(user.phone, "Your AI sales assistant confirms your purchase.");

        // 🚀 START AI CALL CENTER SEQUENCE
        runFollowUp(user, lead, "FOLLOWUP_1");
      }
    }

    res.sendStatus(200);
  }
);

/* ===============================
   STATS
=============================== */
bot.onText(/\/stats/, (msg) => {
  sendTG(msg.chat.id, `
📊 AI CALL CENTER

Leads: ${db.leads.size}
Users: ${db.users.size}
Funnels: ${db.funnels.size}
  `);
});

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/health", (req, res) => {
  res.json({
    status: "AI CALL CENTER ONLINE",
    leads: db.leads.size,
    users: db.users.size,
    funnels: db.funnels.size,
  });
});

/* ===============================
   START SERVER
=============================== */
app.listen(PORT, () => {
  console.log("🚀 AI CALL CENTER SaaS RUNNING (PRO)");
});