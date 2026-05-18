import { NextResponse } from "next/server";
import OpenAI from "openai";
import twilio from "twilio";

// --------------------
// CLIENTS
// --------------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sms = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// --------------------
// MEMORY (TEMP - replace with DB ASAP)
// --------------------
const leads = global.leads || new Map();
global.leads = leads;

// --------------------
// AI MESSAGE BUILDER
// --------------------
async function generateFollowUp(lead, stage) {
  const prompts = [
    "First follow-up: friendly check-in about roofing quote",
    "Second follow-up: polite reminder, offer estimate help",
    "Third follow-up: urgency message (storm/leak awareness)",
    "Final follow-up: last message, polite close",
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `
You are a roofing sales assistant.

Stage: ${stage}
Instruction: ${prompts[stage] || prompts[0]}

Rules:
- 2–3 sentences max
- ONE question only
- Natural human tone
- Focus on roofing repair/replacement/storm damage

Lead:
Name: ${lead?.name || "Unknown"}
Location: ${lead?.location || "Unknown"}
Job: ${lead?.jobType || "Unknown"}
        `,
      },
    ],
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "Follow-up message.";
}

// --------------------
// SEND SMS
// --------------------
async function sendSMS(to, body) {
  if (!to) return;

  return sms.messages.create({
    from: process.env.TWILIO_PHONE,
    to,
    body,
  });
}

// --------------------
// FOLLOW-UP ENGINE
// --------------------
export async function GET() {
  try {
    const now = Date.now();
    const results = [];

    for (const [id, lead] of leads.entries()) {
      if (!lead) continue;

      const last = lead.lastContactAt || lead.createdAt || new Date();
      const hoursSince =
        (now - new Date(last).getTime()) / (1000 * 60 * 60);

      // stop conditions
      if (lead.status === "dead" || lead.followUpStage >= 3) continue;

      let shouldSend = false;

      if (lead.followUpStage === 0 && hoursSince >= 24) shouldSend = true;
      if (lead.followUpStage === 1 && hoursSince >= 72) shouldSend = true;
      if (lead.followUpStage === 2 && hoursSince >= 168) shouldSend = true;

      if (!shouldSend) continue;

      // AI message
      const message = await generateFollowUp(lead, lead.followUpStage);

      // SMS send
      await sendSMS(lead.phone, message);

      // update lead safely
      lead.followUpStage = (lead.followUpStage || 0) + 1;
      lead.lastContactAt = new Date();

      if (!Array.isArray(lead.messages)) {
        lead.messages = [];
      }

      lead.messages.push({
        type: "followup",
        stage: lead.followUpStage,
        message,
        at: new Date(),
      });

      leads.set(id, lead);

      results.push({
        id,
        stage: lead.followUpStage,
        sent: true,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (err) {
    console.error("Follow-up engine error:", err);

    return NextResponse.json(
      { success: false, error: "Follow-up engine failed" },
      { status: 500 }
    );
  }
}