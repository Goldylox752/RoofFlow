function scoreLead(lead) {
  let score = 0;

  // behavioral signals
  if (lead.timeOnSite > 120) score += 20;
  if (lead.pageViews > 3) score += 15;
  if (lead.clickedPricing) score += 25;
  if (lead.planViewed === "growth") score += 10;

  // recency boost
  const hoursSinceActive =
    (Date.now() - new Date(lead.lastActive).getTime()) / 36e5;

  if (hoursSinceActive < 1) score += 20;
  if (hoursSinceActive < 6) score += 10;

  // geo/device heuristics
  if (lead.country === "US") score += 10;
  if (lead.device === "desktop") score += 5;

  return Math.min(score, 100);
}

function classifyLead(score) {
  if (score >= 75) return "HOT";
  if (score >= 45) return "WARM";
  return "COLD";
}

module.exports = { scoreLead, classifyLead };