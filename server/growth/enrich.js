async function enrichLead(lead) {
  // Simulated enrichment (replace with Clearbit/Apollo later)
  return {
    ...lead,
    industry: lead.industry || "home services",
    size: lead.size || "small business",
    painPoints: [
      "low lead volume",
      "manual follow-ups",
      "missed calls"
    ],
    intentScore: Math.floor(Math.random() * 100),
  };
}

module.exports = { enrichLead };