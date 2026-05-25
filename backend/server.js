import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// session memory (simple short-term memory)
const sessions = {};

// intent map
const intents = [
  {
    name: "website",
    keywords: ["website", "web", "landing", "site"],
    reply: "We build high-converting websites designed to turn visitors into customers. What type of business do you run?"
  },
  {
    name: "seo",
    keywords: ["seo", "google", "rank", "traffic"],
    reply: "We help you rank on Google and generate consistent organic leads."
  },
  {
    name: "pricing",
    keywords: ["price", "cost", "how much", "pricing"],
    reply: "Most builds range from $300–$1500 depending on features. What’s your budget?"
  },
  {
    name: "automation",
    keywords: ["automation", "ai", "bot", "crm"],
    reply: "We build automation systems that handle leads, replies, and follow-ups automatically."
  },
  {
    name: "contact",
    keywords: ["whatsapp", "contact", "call", "talk"],
    reply: "WhatsApp: +1 780-267-9673 — fastest response."
  }
];

// intent engine
function detectIntent(msg = "") {
  msg = msg.toLowerCase();
  return intents.find(i =>
    i.keywords.some(k => msg.includes(k))
  );
}

// optional AI fallback (FREE placeholder)
async function aiFallback(message) {
  // You can replace this with:
  // - Groq API (free LLaMA)
  // - HuggingFace inference
  // - OpenRouter free tier

  return "I can help you build a website, improve SEO, or automate your business. What are you focusing on right now?";
}

app.post("/api/bot", async (req, res) => {
  try {
    const { message, sessionId = "default" } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "No message provided" });
    }

    if (!sessions[sessionId]) {
      sessions[sessionId] = { step: 0 };
    }

    const intent = detectIntent(message);

    const reply = intent
      ? intent.reply
      : await aiFallback(message);

    // save lead safely (no crash if supabase fails)
    try {
      await supabase.from("leads").insert([
        {
          session_id: sessionId,
          message,
          reply,
          intent: intent?.name || "unknown"
        }
      ]);
    } catch (e) {
      console.log("Supabase log failed (non-critical)");
    }

    res.json({
      reply,
      intent: intent?.name || "unknown"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "Server error — try again"
    });
  }
});

app.get("/", (req, res) => {
  res.send("Sanche AI Bot running 🚀");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on", port));