// ── Constants ────────────────────────────────────────────────────────────────

const MIN_PRICE = 750;
const MAX_PRICE = 25000;
const PRICING_VERSION = "pricing_v2";

const PLAN_MULTIPLIERS = {
  elite: 2.25,
  growth: 1.5,
  starter: 1.0,
};

const INTENT_BONUS = {
  SALES: 1.2,
  BILLING: 1.1,
  SUPPORT: 1.0,
  USER: 1.0,
  ADMIN: 1.0,
};

// ── Utils ────────────────────────────────────────────────────────────────────

function clamp(n, min, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.min(Math.max(v, min), max);
}

function safePositive(n, fallback) {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

// ── Sub engines ──────────────────────────────────────────────────────────────

function getBaseValue(score) {
  if (score >= 9) return 7500;
  if (score >= 8) return 5000;
  if (score >= 6) return 3000;
  if (score >= 4) return 2000;
  return 1500;
}

function getScarcityFactor(active, capacity) {
  const ratio = active / capacity;

  if (ratio >= 1.5) return 2.5;
  if (ratio >= 1.2) return 2.2;
  if (ratio >= 1.0) return 2.0;
  if (ratio >= 0.8) return 1.6;
  if (ratio >= 0.5) return 1.2;
  return 1.0;
}

function getPlanMultiplier(plan) {
  return PLAN_MULTIPLIERS[plan || "starter"];
}

function getIntentBonus(intent) {
  return INTENT_BONUS[intent || "USER"] || 1.0;
}

function getSurgeBonus(surgeActive) {
  return surgeActive ? 1.35 : 1.0;
}

// ── Main engine ──────────────────────────────────────────────────────────────

export function calculateLeadPrice({
  lead,
  contractor,
  cityRow,
  systemMetrics,
}) {
  const score = clamp(Number(lead?.score ?? 1), 1, 10);

  const capacity = safePositive(cityRow?.capacity, 1);
  const active = Math.max(Number(cityRow?.active_contractors) || 0, 0);
  const market = cityRow?.market || "unknown";

  const baseValue = getBaseValue(score);

  const demandMultiplier = clamp(
    Number(systemMetrics?.demandMultiplier ?? 1),
    0.5,
    3
  );

  const contractorMultiplier = getPlanMultiplier(contractor?.plan);
  const scarcity = getScarcityFactor(active, capacity);
  const surgeBonus = getSurgeBonus(systemMetrics?.surgeActive);
  const intentBonus = getIntentBonus(lead?.intent);

  const raw =
    baseValue *
    demandMultiplier *
    contractorMultiplier *
    scarcity *
    surgeBonus *
    intentBonus;

  const rounded = Math.round(raw);
  const finalPrice = clamp(rounded, MIN_PRICE, MAX_PRICE);
  const capped = rounded > MAX_PRICE;

  if (capped) {
    console.warn(
      `[pricing] price capped | leadId=${lead?.id} raw=${rounded} market=${market}`
    );
  }

  return {
    finalPrice,
    rawPrice: raw,
    capped,
    breakdown: {
      score,
      baseValue,
      demandMultiplier,
      contractorMultiplier,
      scarcity,
      surgeBonus,
      intentBonus,
      capacity,
      active,
      market,
    },
    meta: {
      leadId: lead?.id,
      contractorId: contractor?.id,
      market,
      lockedAt: new Date().toISOString(),
      version: PRICING_VERSION,
    },
  };
}

// ── Audit helper ─────────────────────────────────────────────────────────────

export function formatPricingAudit(result) {
  const b = result.breakdown;

  return [
    `[pricing audit]`,
    `market       : ${b.market}`,
    `score        : ${b.score}`,
    `base value   : $${b.baseValue}`,
    `demand       : ${b.demandMultiplier}`,
    `contractor   : ${b.contractorMultiplier}`,
    `scarcity     : ${b.scarcity}`,
    `surge        : ${b.surgeBonus}`,
    `intent       : ${b.intentBonus}`,
    `final price  : $${result.finalPrice}`,
    `capped       : ${result.capped}`,
  ].join("\n");
}