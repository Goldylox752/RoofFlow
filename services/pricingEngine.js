function calculatePrice(score, city = "") {
  if (typeof score !== "number") {
    throw new Error("Invalid score");
  }

  let base;

  /* ===============================
     SCORE TIERS
  =============================== */
  if (score >= 80) base = 150;
  else if (score >= 60) base = 100;
  else base = 50;

  /* ===============================
     CITY NORMALIZATION
  =============================== */
  const normalizedCity = city.trim().toLowerCase();

  const cityMultipliers = {
    calgary: 1.1,
    edmonton: 1.05,
    toronto: 1.2,
  };

  const multiplier = cityMultipliers[normalizedCity] || 1;

  const finalPrice = Math.round(base * multiplier);

  return Math.max(finalPrice, 0);
}