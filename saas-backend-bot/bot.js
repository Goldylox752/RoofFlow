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

for (const k of REQUIRED) {
  if (!process.env[k]) throw new Error(`Missing env: ${k}`);
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
   CORE INIT
=============================== */
const app = express();
app.use(express.json());

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/* ===============================
   🧠 EVENT LOGGING (IMPORTANT UPGRADE)
=============================== */
function log(event, data = {}) {
  console.log(`[${event}]`, JSON.stringify(data));
}

/* ===============================
   MEMORY LAYER (replace with Postgres later)
=============================== */
const db = {
  users: new Map(),
  leads: new Map(),

  // AI CALL CENTER CORE
  funnels: new Map(),     // userId -> state
  calls: new Map(),       // callId -> call session
  queue: [],              // job queue (replace with BullMQ later)
};

/* ===============================
   USER
=============================== */
function getUser(tgUser) {
  if (!db.users.has(tgUser.id)) {
    db.users.set(tgUser.id, {
      id: tgUser.id,
      username: tgUser.username || "unknown",
      phone: null,
      deals: 0,
      createdAt: Date.now(),
    });
  }
  return db.users.get(tgUser.id);
}

/* ===============================
   SAFE TELEGRAM
=============================== */
const sendTG = async (id, msg) => {
  try {
    await bot.sendMessage(id, msg);
  } catch (e) {
    log("TG_ERROR", e.message);
  }
};

/* ===============================
   TWILIO LAYER (SMS + VOICE CALL SESSION)
=============================== */
async function sms(to, text) {
  if (!to) return;
  try {
    await twilioClient.messages.create({
      body: text,
      from: TWILIO_PHONE_NUMBER,
      to,
    });
  } catch (e) {
    log("SMS_ERROR", e.message);
  }
}

/* ===============================
   📞 CALL SESSION SYSTEM (IMPORTANT UPGRADE)
=============================== */
async function createCall(to, script, callType = "OUTBOUND") {
  if (!to) return;

  const callId = `call_${Date.now()}`;

  db.calls.set(callId, {
    id: callId,
    to,
    status: "initiated",
    type: callType,
    createdAt: Date.now(),
  });

  try {
    const call = await twilioClient.calls.create({
      to,
      from: TWILIO_PHONE_NUMBER,
      twiml: `
        <Response>
          <Pause length="1"/>
          <Say voice="alice">${script}</Say>
        </Response>
      `,
    });

    db.calls.get(callId).status = "in-progress";
    db.calls.get(callId).twilioSid = call.sid;

    log("CALL_STARTED", { callId, to });
  } catch (e) {
    db.calls.get(callId).status = "failed";
    log("CALL_ERROR", e.message);
  }

  return callId;
}

/* ===============================
   🧠 AI DECISION ENGINE
=============================== */
function ai(stage, lead) {
  const flow = {
    NEW: {
      sms: `New ${lead.category} lead in ${lead.city}`,
      voice: `New high value lead available in ${lead.city}`,
      next: "F1",
    },
    F1: {
      sms: `Reminder: lead still available`,
      voice: `First follow-up. Lead still active`,
      next: "F2",
    },
    F2: {
      sms: `Final warning: lead closing soon`,
      voice: `Final alert before reassignment`,
      next: "CLOSE",
    },
  };

  return flow[stage] || null;
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

  broadcast(lead);
  return lead;
}

/* ===============================
   LOCK + FUNNEL INIT
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
function broadcast(lead) {
  const msg = `
🔥 NEW AI VERIFIED LEAD
📍 ${lead.city}
🏷 ${lead.category}
⭐ ${lead.score}/100
💰 $${lead.price}

/buy ${lead.id}
  `.trim();

  for (const u of db.users.values()) {
    sendTG(u.id, msg);
  }
}

/* ===============================
   STRIPE CHECKOUT
=============================== */
async function checkout(lead, userId) {
  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: `Lead ${lead.city}`,
          description: lead.category,
        },
        unit_amount: lead.price * 100,
      },
      quantity: 1,
    }],
    metadata: {
      leadId: lead.id,
      userId: String(userId),
    },
    success_url: `${CLIENT_URL}/success`,
    cancel_url: `${CLIENT_URL}/cancel`,
  });
}

/* ===============================
   🚀 QUEUE-BASED FOLLOWUP ENGINE (REAL UPGRADE)
=============================== */
function enqueue(job) {
  db.queue.push(job);
}

/**
 * background worker
 */
setInterval(async () => {
  const job = db.queue.shift();
  if (!job) return;

  const { user, lead, stage } = job;

  const step = ai(stage, lead);
  if (!step) return;

  const funnel = db.funnels.get(user.id);
  if (!funnel) return;

  funnel.stage = step.next;
  funnel.updatedAt = Date.now();

  await sms(user.phone, step.sms);
  await createCall(user.phone, step.voice);

  if (step.next !== "CLOSE") {
    enqueue({
      user,
      lead,
      stage: step.next,
      runAt: Date.now() + 300000,
    });
  }

  log("FOLLOWUP_RUN", { userId: user.id, stage });
}, 2000);

/* ===============================
   TELEGRAM
=============================== */
bot.setMyCommands([
  { command: "start", description: "AI Call Center SaaS" },
  { command: "leads", description: "Browse leads" },
  { command: "add", description: "Generate lead" },
  { command: "buy", description: "Purchase lead" },
  { command: "stats", description: "Analytics" },
]);

bot.onText(/\/start/, (msg) => {
  const u = getUser(msg.from);

  sendTG(msg.chat.id, `
Welcome ${u.username}

🤖 AI CALL CENTER SaaS ONLINE
✔ Queue Engine
✔ Call Session System
✔ SMS Automation
✔ AI Follow-up Pipeline
  `);
});

/* ===============================
   LEADS
=============================== */
bot.onText(/\/leads/, (msg) => {
  const leads = [...db.leads.values()]
    .filter(l => l.status === "available")
    .slice(-10);

  if (!leads.length) return sendTG(msg.chat.id, "No leads");

  sendTG(msg.chat.id,
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
    score: 92,
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

  const session = await checkout(lead, user.id);

  sendTG(msg.chat.id, `💳 Pay:\n${session.url}`);
});

/* ===============================
   STRIPE WEBHOOK (AI ACTIVATION)
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
    const { leadId, userId } = event.data.object.metadata;

    const lead = db.leads.get(leadId);
    const user = db.users.get(Number(userId));

    if (!lead || !user) return res.sendStatus(200);

    lead.status = "sold";
    user.deals++;

    await sendTG(user.id, `
🔥 DEAL CLOSED
📍 ${lead.city}
🏷 ${lead.category}
⭐ ${lead.score}
    `);

    if (user.phone) {
      await sms(user.phone, "Deal closed. AI system activated.");

      await createCall(
        user.phone,
        `Your AI assistant confirms your purchase in ${lead.city}`,
        "OUTBOUND"
      );

      enqueue({
        user,
        lead,
        stage: "F1",
        runAt: Date.now() + 300000,
      });
    }
  }

  res.sendStatus(200);
});

/* ===============================
   STATS
=============================== */
bot.onText(/\/stats/, (msg) => {
  sendTG(msg.chat.id, `
📊 AI CALL CENTER SAAS
Leads: ${db.leads.size}
Users: ${db.users.size}
Calls: ${db.calls?.size || 0}
Queue: ${db.queue.length}
  `);
});

/* ===============================
   HEALTH
=============================== */
app.get("/health", (req, res) => {
  res.json({
    status: "AI CALL CENTER PRO",
    leads: db.leads.size,
    users: db.users.size,
    calls: db.calls.size,
    queue: db.queue.length,
  });
});

/* ===============================
   START
=============================== */
app.listen(PORT, () => {
  console.log("🚀 AI CALL CENTER PRO LIVE (QUEUE-BASED)");
});