// /server/engines/pricing.engine.ts

type Lead = {
  id?: string;
  score?: number;
};

type Contractor = {
  plan?: "starter" | "growth" | "elite";
};

type CityRow = {
  capacity?: number;
  active_contractors?: number;
};

type SystemMetrics = {
  demandMultiplier?: number;
};

type PricingInput = {
  lead: Lead;
  contractor: Contractor;
  cityRow: CityRow;
  systemMetrics: SystemMetrics;
};

const MIN_PRICE = 750;
const MAX_PRICE = 25000;

/* ===============================
   SAFE UTILS
=============================== */
function clamp(n: number, min: number, max: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.min(Math.max(v, min), max);
}

/* ===============================
   BASE VALUE ENGINE
=============================== */
function getBaseValue(score: number) {
  if (score >= 8) return 5000;
  if (score >= 6) return 3000;
  return 1500;
}

/* ===============================
   SCARCITY MODEL
=============================== */
function getScarcityFactor(active: number, capacity: number) {
  const ratio = active / capacity;

  if (ratio >= 1.2) return 2.2;
  if (ratio >= 1.0) return 2.0;
  if (ratio >= 0.8) return 1.6;
  if (ratio >= 0.5) return 1.2;
  return 1;
}

/* ===============================
   MAIN PRICING ENGINE (SOURCE OF TRUTH)
=============================== */
export function calculateLeadPrice({
  lead,
  contractor,
  cityRow,
  systemMetrics,
}: PricingInput) {
  const score = clamp(Number(lead?.score), 1, 10);

  const baseValue = getBaseValue(score);

  const demandMultiplier = clamp(
    Number(systemMetrics?.demandMultiplier ?? 1),
    0.5,
    3
  );

  const contractorMultiplier =
    contractor?.plan === "elite"
      ? 2.25
      : contractor?.plan === "growth"
      ? 1.5
      : 1;

  const capacity = Math.max(Number(cityRow?.capacity) || 1, 1);
  const active = Math.max(Number(cityRow?.active_contractors) || 0, 0);

  const scarcity = getScarcityFactor(active, capacity);

  const raw =
    baseValue *
    demandMultiplier *
    contractorMultiplier *
    scarcity;

  const finalPrice = clamp(Math.round(raw), MIN_PRICE, MAX_PRICE);

  return {
    finalPrice,
    rawPrice: raw,
    breakdown: {
      score,
      baseValue,
      demandMultiplier,
      contractorMultiplier,
      scarcity,
      capacity,
      active,
    },
    meta: {
      lockedAt: new Date().toISOString(),
      version: "pricing_v1",
    },
  };
}