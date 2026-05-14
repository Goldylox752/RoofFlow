require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const Stripe = require("stripe");
const twilio = require("twilio");
const crypto = require("crypto");

/* ===============================
   INIT
=============================== */
const app = express();
app.use(express.json());

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* ===============================
   MEMORY DB (replace with Postgres later)
=============================== */
const db = {
  users: new Map(),
  leads: new Map(),
  funnels: new Map(),
  calls: new Map(),
  queue: [],
};

/* ===============================
   UTIL
=============================== */
const log = (...args) => console.log("[CALLCENTER]", ...args);

const sendTG = (id, msg) =>
  bot.sendMessage(id, msg).catch(() => {});

/* ===============================
   USER SYSTEM
=============================== */
function getUser(tg) {
  if (!db.users.has(tg.id)) {
    db.users.set(tg.id, {
      id: tg.id,
      username: tg.username || "unknown",
      phone: null,
      createdAt: Date.now(),
      deals: 0,
    });
  }
  return db.users.get(tg.id);
}

/* ===============================
   LEAD ENGINE
=============================== */
function createLead(data) {
  const id = crypto.randomUUID();

  const lead = {
    id,
    city: data.city,
    category: data.category,
    price: data.price || 25,
    score: data.score || 50,
    status: "available",
    createdAt: Date.now(),
  };

  db.leads.set(id, lead);
  broadcastLead(lead);

  return lead;
}

function broadcastLead(lead) {
  const msg = `
🔥 NEW LEAD
📍 ${lead.city}
🏷 ${lead.category}
⭐ ${lead.score}
💰 $${lead.price}

BUY: /buy ${lead.id}
  `.trim();

  for (const u of db.users.values()) {
    sendTG(u.id, msg);
  }
}

/* ===============================
   LOCK + FUNNEL
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
   TWILIO CALL (REAL PSTN CALL)
=============================== */
async function makeCall(to, message) {
  const callId = crypto.randomUUID();

  db.calls.set(callId, {
    id: callId,
    to,
    status: "queued",
    createdAt: Date.now(),
  });

  try {
    const call = await twilioClient.calls.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      twiml: `
        <Response>
          <Pause length="1"/>
          <Say voice="alice">${message}</Say>
        </Response>
      `,
    });

    db.calls.get(callId).status = "completed";
    db.calls.get(callId).sid = call.sid;

  } catch (err) {
    db.calls.get(callId).status = "failed";
    log("CALL_ERROR", err.message);
  }

  return callId;
}

/* ===============================
   AI LOGIC (HOOK FOR GPT LATER)
=============================== */
function ai(stage, lead) {
  const flow = {
    NEW: {
      sms: `New lead in ${lead.city}`,
      voice: `New high value lead in ${lead.city}`,
      next: "F1",
    },
    F1: {
      sms: `Reminder: lead still active`,
      voice: `First follow-up alert`,
      next: "F2",
    },
    F2: {
      sms: `Final warning`,
      voice: `Closing soon`,
      next: "CLOSE",
    },
  };

  return flow[stage] || null;
}

/* ===============================
   QUEUE WORKER (REAL UPGRADE)
=============================== */
setInterval(async () => {
  const job = db.queue.shift();
  if (!job) return;

  const { user, lead, stage } = job;
  const step = ai(stage, lead);

  if (!step) return;

  const funnel = db.funnels.get(user.id);
  if (!funnel) return;

  funnel.stage = step.next;

  sendTG(user.id, `📡 ${step.sms}`);

  await makeCall(user.phone, step.voice);

  if (step.next !== "CLOSE") {
    db.queue.push({
      user,
      lead,
      stage: step.next,
    });
  }

}, 2000);

/* ===============================
   STRIPE WEBHOOK
=============================== */
app.post("/stripe-webhook", async (req, res) => {
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const { leadId, userId } = event.data.object.metadata;

      const lead = db.leads.get(leadId);
      const user = db.users.get(Number(userId));

      if (!lead || !user) return res.sendStatus(200);

      lead.status = "sold";
      user.deals++;

      sendTG(user.id, `🔥 DEAL CLOSED: ${lead.city}`);

      if (user.phone) {
        await makeCall(user.phone, `Your purchase in ${lead.city} is confirmed`);

        db.queue.push({
          user,
          lead,
          stage: "F1",
        });
      }
    }

    res.sendStatus(200);

  } catch {
    res.sendStatus(400);
  }
});

/* ===============================
   TELEGRAM COMMANDS
=============================== */
bot.onText(/\/add/, (msg) => {
  createLead({
    city: "Calgary",
    category: "roofing",
    score: 90,
    price: 29,
  });

  sendTG(msg.chat.id, "Lead created");
});

bot.onText(/\/leads/, (msg) => {
  const leads = [...db.leads.values()].slice(-10);

  sendTG(msg.chat.id,
    leads.map(l => `${l.id} | ${l.city} | $${l.price}`).join("\n")
  );
});

bot.onText(/\/buy (.+)/, (msg, match) => {
  const user = getUser(msg.from);
  const lead = db.leads.get(match[1]);

  if (!lead) return sendTG(msg.chat.id, "Not found");

  lockLead(lead.id, user.id);

  sendTG(msg.chat.id, "Locked. Proceeding to checkout...");
});

/* ===============================
   START
=============================== */
app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 CALL CENTER SYSTEM ONLINE (UPGRADED)");
});