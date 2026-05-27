import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const app = express();

/* ───────── MIDDLEWARE ───────── */
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests" }
  })
);

/* ───────── SUPABASE ───────── */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ───────── INTENT MODEL ───────── */
const intents = [
  {
    name: "website",
    keywords: ["website", "site", "landing"],
    reply: "We build high-converting websites for service businesses.",
    score: 0.7
  },
  {
    name: "seo",
    keywords: ["seo", "rank", "google"],
    reply: "We help you rank on Google and generate organic leads.",
    score: 0.8
  },
  {
    name: "pricing",
    keywords: ["price", "cost", "how much"],
    reply: "Most systems range from $300–$1500 depending on setup.",
    score: 0.6
  },
  {
    name: "automation",
    keywords: ["automation", "ai", "bot", "crm"],
    reply: "We build AI systems that automate leads, follow-ups, and bookings.",
    score: 0.9
  },
  {
    name: "contact",
    keywords: ["contact", "whatsapp", "call"],
    reply: "WhatsApp: +1 780-267-9673",
    score: 0.5
  }
];

/* ───────── INTENT DETECTOR ───────── */
function detectIntent(message = "") {
  const text = message.toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  for (const intent of intents) {
    const matchCount = intent.keywords.filter(k =>
      text.includes(k)
    ).length;

    if (matchCount > 0) {
      const score = matchCount * intent.score;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = intent;
      }
    }
  }

  return bestMatch;
}

/* ───────── RESPONSE ENGINE ───────── */
function generateReply(intent) {
  if (!intent) {
    return {
      text: "I can help you build a website, SEO system, or AI automation funnel. What are you trying to create?",
      type: "fallback",
      confidence: 0.2
    };
  }

  return {
    text: intent.reply,
    type: intent.name,
    confidence: intent.score
  };
}

/* ───────── LEAD SCORING ───────── */
function scoreLead(message, intent) {
  let score = 10;

  if (message.length > 40) score += 10;
  if (intent?.name === "automation") score += 20;
  if (intent?.name === "pricing") score += 15;

  return Math.min(score, 100);
}

/* ───────── BOT ENDPOINT ───────── */
app.post("/api/bot", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    const cleanSessionId = sessionId || crypto.randomUUID();

    const intent = detectIntent(message);
    const response = generateReply(intent);
    const leadScore = scoreLead(message, intent);

    /* prevent duplicate spam */
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("session_id", cleanSessionId)
      .limit(1);

    if (!existing || existing.length === 0) {
      await supabase.from("leads").insert([
        {
          session_id: cleanSessionId,
          message,
          reply: response.text,
          intent: response.type,
          lead_score: leadScore,
          confidence: response.confidence,
          created_at: new Date().toISOString()
        }
      ]);
    }

    /* analytics event stream */
    await supabase.from("events").insert([
      {
        type: "chat_message",
        intent: response.type,
        score: leadScore,
        created_at: new Date().toISOString()
      }
    ]);

    return res.json({
      ...response,
      leadScore,
      sessionId: cleanSessionId
    });

  } catch (err) {
    console.error("BOT ERROR:", err);

    return res.status(500).json({
      error: "Server error"
    });
  }
});

/* ───────── HEALTH ───────── */
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "AI Lead Engine v2"
  });
});

/* ───────── START ───────── */
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 AI Lead Engine running on port ${port}`);
});