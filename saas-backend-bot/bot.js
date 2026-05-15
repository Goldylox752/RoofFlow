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

/* Stripe webhook MUST use raw body */
app.use("/stripe-webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));

/* ENV GUARDS */
if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("Missing TELEGRAM_BOT_TOKEN");
if (!process.env.STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");

/* SERVICES */
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

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

const sendTG = async (id, msg) => {
  try {
    await bot.sendMessage(id, msg);
  } catch (err) {
    log("Telegram error:", err.message);
  }
};

/* ===============================
   USER SYSTEM
=============================== */
function getUser(tg) {
  if (!tg?.id) return null;

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
  const msg = [
    "NEW LEAD",
    `City: ${lead.city}`,
    `Category: ${lead.category}`,
    `Score: ${lead.score}`,
    `Price: $${lead.price}`,
    "",
    `BUY: /buy ${lead.id}`,
  ].join("\n");

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
   TWILIO CALL (SAFE)
=============================== */
async function makeCall(to, message) {
  if (!twilioClient) {
    log("Twilio not configured");
    return null;
  }

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

    return callId;
  } catch (err) {
    db.calls.get(callId).status = "failed";
    log("CALL_ERROR", err.message);
    return null;
  }
}

/* ===============================
   AI FLOW ENGINE
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
   QUEUE WORKER
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

  await sendTG(user.id, `MESSAGE: ${step.sms}`);

  await makeCall(user.phone, step.voice);

  if (step.next !== "CLOSE") {
    db.queue.push({
      user,
      lead,
      stage: step.next,
    });
  }
}, 3000);

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
      const { leadId, userId } = event.data.object.metadata || {};

      const lead = db.leads.get(leadId);
      const user = db.users.get(Number(userId));

      if (!lead || !user) return res.sendStatus(200);

      lead.status = "sold";
      user.deals++;

      await sendTG(user.id, `DEAL CLOSED: ${lead.city}`);

      if (user.phone) {
        await makeCall(user.phone, `Purchase confirmed in ${lead.city}`);

        db.queue.push({
          user,
          lead,
          stage: "F1",
        });
      }
    }

    res.sendStatus(200);
  } catch (err) {
    log("Webhook error:", err.message);
    res.sendStatus(400);
  }
});

/* ===============================
   TELEGRAM COMMANDS
=============================== */
bot.onText(/\/add/, (msg) => {
  const user = getUser(msg.from);

  if (!user) return;

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

  sendTG(
    msg.chat.id,
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
  console.log("CALL CENTER SYSTEM ONLINE");
});