const calculateScore = require("../utils/scoring");
const getTier = require("../utils/scoring");
const calculatePrice = require("../utils/pricing");

function aiAnalyzeLead(lead) {
  const baseScore = calculateScore(lead);
  const tier = getTier(baseScore);
  const price = calculatePrice(baseScore, lead.city);

  // 🧠 AI logic layer (rule-based “AI v1”)
  const confidence =
    baseScore > 80 ? "high" :
    baseScore > 50 ? "medium" : "low";

  const conversionProbability =
    baseScore > 80 ? 0.75 :
    baseScore > 50 ? 0.45 : 0.2;

  const recommendation =
    baseScore > 80 ? "upsell_elite" :
    baseScore > 50 ? "standard_offer" : "nurture";

  return {
    score: baseScore,
    tier,
    price,
    confidence,
    conversionProbability,
    recommendation,
  };
}

module.exports = {
  aiAnalyzeLead,
};