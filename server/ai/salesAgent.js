const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function salesAgent(lead) {
  const prompt = `
You are an AI sales operator.

Decide what to do with this lead.

Lead:
- score: ${lead.score}
- city: ${lead.city}
- status: ${lead.status}

Return ONLY JSON:
{
  "action": "IGNORE | FOLLOW_UP | CLOSE",
  "reason": "short explanation",
  "priority": 1-10
}
`;

  const res = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  try {
    return JSON.parse(res.choices[0].message.content);
  } catch {
    return {
      action: "IGNORE",
      reason: "parse_error",
      priority: 0,
    };
  }
}

module.exports = { salesAgent };