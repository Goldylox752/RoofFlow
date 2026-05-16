export function scoreLead(lead: any) {
  let score = 0;

  /* ===============================
     TRUST SIGNALS
  =============================== */
  if (lead.rating >= 4.2) score += 20;
  if (lead.reviews > 50) score += 25;
  if (lead.reviews > 200) score += 35;

  /* ===============================
     INTENT SIGNALS
  =============================== */
  const text = (lead.name || "").toLowerCase();

  if (text.includes("roof")) score += 20;
  if (text.includes("construction")) score += 10;

  /* ===============================
     GEO SIGNALS
  =============================== */
  const hotCities = ["edmonton", "leduc", "calgary"];

  const address = (lead.address || "").toLowerCase();

  if (hotCities.some((c) => address.includes(c))) {
    score += 15;
  }

  return Math.min(score, 100);
}