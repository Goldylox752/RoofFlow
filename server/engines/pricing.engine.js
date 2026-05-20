export function calculatePrice(score, city = "") {
  if (typeof score !== "number") {
    throw new Error("Invalid score");
  }

  let base = 50;

  /* ===============================
     SCORE TIERS
  =============================== */
  if (score >= 80) base = 150;
  else if (score >= 60) base = 100;

  /* ===============================
     CITY MULTIPLIERS
  =============================== */
  const cityKey = city ? city.trim().toLowerCase() : "";

  const multipliers = {
    calgary: 1.1,
    edmonton: 1.05,
    toronto: 1.2,
  };

  const multiplier = multipliers[cityKey] || 1;

  return Math.max(Math.round(base * multiplier), 0);
}