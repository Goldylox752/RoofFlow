const MIN_PRICE = 750;
const MAX_PRICE = 25000;

export function lockLeadPrice({
  lead,
  contractor,
  cityRow,
  systemMetrics,
}: LockLeadPriceInput) {
  const score = clamp(Number(lead?.score), 1, 10);

  const baseLeadValue = getBaseLeadValue(score);

  const demandMultiplier = clamp(
    Number(systemMetrics?.demandMultiplier),
    0.5,
    3
  );

  const contractorTierMultiplier =
    contractor?.plan === "elite"
      ? 2.25
      : contractor?.plan === "growth"
      ? 1.5
      : 1;

  const capacity = Math.max(Number(cityRow?.capacity) || 1, 1);
  const active = Math.max(Number(cityRow?.active_contractors) || 0, 0);

  const saturation = active / capacity;

  const cityScarcityFactor =
    saturation >= 1.2 ? 2.2 :
    saturation >= 1.0 ? 2.0 :
    saturation >= 0.8 ? 1.6 :
    saturation >= 0.5 ? 1.2 :
    1;

  const rawPrice = calculateFinalPrice({
    baseLeadValue,
    demandMultiplier,
    contractorTierMultiplier,
    cityScarcityFactor,
  });

  const finalPrice = clamp(Math.round(rawPrice), MIN_PRICE, MAX_PRICE);

  return Object.freeze({
    finalPrice,
    lockedAt: new Date().toISOString(),
    breakdown: {
      baseLeadValue,
      demandMultiplier,
      contractorTierMultiplier,
      cityScarcityFactor,
      saturation,
      rawPrice,
    },
  });
}