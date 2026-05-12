const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;

const enabled = () => !!TG_TOKEN && !!TG_CHAT_ID;

const send = async (text) => {
  if (!enabled()) return;

  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error("Telegram Mode error:", err);
  }
};

/* ===============================
   FORMATTED EVENTS
=============================== */

const tg = {
  leadCreated: (lead) => send(
    `🟢 *NEW LEAD*\n` +
    `ID: ${lead.id}\n` +
    `Email: ${lead.email || "N/A"}\n` +
    `City: ${lead.city || "N/A"}\n` +
    `Score: ${lead.score}\n` +
    `Tier: ${lead.tier}`
  ),

  checkoutCreated: (lead, price) => send(
    `💳 *CHECKOUT*\n` +
    `Lead: ${lead.id}\n` +
    `Price: $${price}`
  ),

  assigned: (lead, contractorId) => send(
    `⚡ *ASSIGNED*\n` +
    `Lead: ${lead.id}\n` +
    `Contractor: ${contractorId}`
  ),

  error: (err) => send(
    `❌ *SYSTEM ERROR*\n` +
    `${err?.message || err}`
  ),
};

module.exports = tg;