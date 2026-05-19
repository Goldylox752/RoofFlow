export function aiScoreLead(lead) {
  const score = lead?.score || 0;

  return {
    score,
    tier: score > 80 ? "HIGH" : score > 50 ? "MEDIUM" : "LOW",
  };
}