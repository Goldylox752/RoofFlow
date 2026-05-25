import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();

/* ─────────────────────────
   MIDDLEWARE
───────────────────────── */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ─────────────────────────
   ENV SAFETY CHECK
───────────────────────── */
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️ Supabase env variables missing");
}

/* ─────────────────────────
   SUPABASE
───────────────────────── */
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/* ─────────────────────────
   SESSION STORE (lightweight)
   NOTE: replace with Redis later
───────────────────────── */
const sessions = new Map();

/* ─────────────────────────
   INTENTS (OPTIMIZED STRUCTURE)
───────────────────────── */
const intents = [
  {
    name: "website",
    keywords: ["website", "web", "landing", "site", "build"],
    reply:
      "We build high-converting websites designed to turn visitors into paying customers."
  },
  {
    name: "seo",
    keywords: ["seo", "google", "rank", "traffic"],
    reply:
      "We help businesses rank on Google and generate consistent organic leads without ads."
  },
  {
    name: "pricing",
    keywords: ["price", "cost", "how much", "pricing"],
    reply:
      "Most projects range from $300–$1500 depending on features."
  },
  {
    name: "automation",
    keywords: ["automation", "ai", "bot", "crm", "system"],
    reply:
      "We build automation systems that handle leads, follow-ups, and conversions automatically."
  },
  {
    name: "contact",
    keywords: ["contact", "whatsapp", "call", "talk"],
    reply:
      "WhatsApp us at +1 780-267-9673 for fastest response."
  }
];

/* ─────────────────────────
   INTENT ENGINE (FAST LOOKUP)
───────────────────────── */
function detectIntent(message = "") {
  const msg = message.toLowerCase();

  for (const intent of intents) {
    for (const keyword of intent.keywords) {
      if (msg.includes(keyword)) return intent;
    }
  }

  return null;
}

/* ─────────────────────────
   RESPONSE ENGINE (SMART VARIATION)
───────────────────────── */
function generateReply(intent, message) {
  if (!intent) {
    return {
      text:
        "Got it — what are you trying to build? I can help with websites, SEO, or automation.",
      type: "fallback"
    };
  }

  let text = intent.reply;

  if (intent.name === "pricing") {
    text += " What budget are you working with?";
  }

  if (intent.name === "website") {
    text += " What type of business do you run?";
  }

  if (intent.name === "seo") {
    text += " Are you currently getting traffic?";
  }

  return {
    text,
    type: intent.name
  };
}

/* ─────────────────────────
   BOT ENDPOINT
───────────────────────── */
app.post("/api/bot", async (req, res) => {
  try {
    const { message, sessionId = "default" } = req.body;

    if (!message) {
      return res.status(400).json({
        reply: "Message is required",
        type: "error"
      });
    }

    /* session tracking */
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        step: 0,
        createdAt: Date.now()
      });
    }

    const intent = detectIntent(message);
    const response = generateReply(intent, message);

    /* ───────── SUPABASE SAFE INSERT ───────── */
    try {
      await supabase.from("leads").insert([
        {
          session_id: sessionId,
          message,
          reply: response.text,
          intent: response.type
        }
      ]);
    } catch (dbErr) {
      console.error("Supabase error (non-blocking):", dbErr.message);
    }

    /* ───────── RESPONSE ───────── */
    return res.json({
      reply: response.text,
      type: response.type
    });

  } catch (err) {
    console.error("Server crash:", err);

    return res.status(500).json({
      reply: "Server error — please try again later.",
      type: "error"
    });
  }
});

/* ─────────────────────────
   HEALTH CHECK
───────────────────────── */
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "RoofFlow AI Bot",
    version: "2.0"
  });
});

/* ─────────────────────────
   START SERVER
───────────────────────── */
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});