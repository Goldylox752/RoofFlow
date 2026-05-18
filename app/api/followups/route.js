import { NextResponse } from "next/server";

const leads = globalThis.leads ?? new Map();
globalThis.leads = leads;

// --------------------
// SIMPLE MESSAGE SYSTEM (NO AI)
// --------------------
function generateFollowUp(lead, stage) {
  const messages = [
    "Hey 👋 just checking in — are you still looking to get your roof looked at?",
    "Quick follow-up — I can still lock in your estimate if you want.",
    "Storm season is coming — want me to recheck your roof condition?",
    "Last check-in — should I close this out or keep it open for you?",
  ];

  return messages[stage] || messages[0];
}

// --------------------
// SMS DISABLED (SAFE MODE)
// --------------------
async function sendSMS(to, body) {
  console.log("[SMS DISABLED]", { to, body });
  return true;
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

      const last = new Date(
        lead.lastContactAt || lead.createdAt || Date.now()
      );

      const hoursSince = (now - last.getTime()) / (1000 * 60 * 60);

      if (lead.status === "dead" || lead.followUpStage >= 3) continue;

      const shouldSend =
        (lead.followUpStage === 0 && hoursSince >= 24) ||
        (lead.followUpStage === 1 && hoursSince >= 72) ||
        (lead.followUpStage === 2 && hoursSince >= 168);

      if (!shouldSend) continue;

      const message = generateFollowUp(lead, lead.followUpStage);

      await sendSMS(lead.phone, message);

      lead.followUpStage = (lead.followUpStage || 0) + 1;
      lead.lastContactAt = new Date();

      leads.set(id, lead);

      results.push({ id, sent: true });
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err) {
    console.error("[FOLLOWUP ERROR]", err);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}