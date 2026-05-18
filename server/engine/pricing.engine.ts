// /server/engines/pricing.engine.ts

// ── Types ─────────────────────────────────────────────────────────────────────

type LeadTier = "HOT" | "WARM" | "COLD";

type Lead = {
  id?: string;
  score?: number;
  tier?: LeadTier;
  intent?: string;
  source?: string;
};

type ContractorPlan = "starter" | "growth" | "elite";

type Contractor = {
  id?: string;
  plan?: ContractorPlan;
  verified?: boolean;
  responseRate?: number; // 0–1, for future dynamic discounting
};

type CityRow = {
  capacity?: number;
  active_contractors?: number;
  market?: string;
};

type SystemMetrics = {
  demandMultiplier?: number;
  surgeActive?: boolean;
};

type PricingInput = {
  lead: Lead;
  contractor: Contractor;
  cityRow: CityRow;
  systemMetrics: SystemMetrics;
};

type PricingResult = {
  finalPrice: number;
  rawPrice: number;
  capped: boolean;
  breakdown: {
    score: number;
    baseValue: number;
    demandMultiplier: number;
    contractorMultiplier: number;
    scarcity: number;
    surgeBonus: number;
    intentBonus: number;
    capacity: number;
    active: number;
    market: string;
  };
  meta: {
    leadId: string | undefined;
    contractorId: string | undefined;
    market: string;
    lockedAt: string;
    version: string;
  };
};

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_PRICE = 750;
const MAX_PRICE = 25_000;
const PRICING_VERSION = "pricing_v2";

// Plan multipliers — single source of truth
const PLAN_MULTIPLIERS: Record<ContractorPlan, number> = {
  elite: 2.25,
  growth: 1.5,
  starter: 1.0,
};

// Intent premiums — high-value intents pay more
const INTENT_BONUS: Record<string, number> = {
  SALES: 1.2,
  BILLING: 1.1,
  SUPPORT: 1.0,
  USER: 1.0,
  ADMIN: 1.0,
};

// ── Safe Utils ────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.min(Math.max(v, min), max);
}

function safePositive(n: unknown, fallback: number): number {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

// ── Sub-engines ───────────────────────────────────────────────────────────────

function getBaseValue(score: number): number {
  if (score >= 9) return 7500;  // NEW: elite score tier
  if (score >= 8) return 5000;
  if (score >= 6) return 3000;
  if (score >= 4) return 2000;  // NEW: mid tier
  return 1500;
}

function getScarcityFactor(active: number, capacity: number): number {
  const ratio = active / capacity;
  if (ratio >= 1.5) return 2.5;  // NEW: extreme scarcity
  if (ratio >= 1.2) return 2.2;
  if (ratio >= 1.0) return 2.0;
  if (ratio >= 0.8) return 1.6;
  if (ratio >= 0.5) return 1.2;
  return 1.0;
}

function getPlanMultiplier(plan?: ContractorPlan): number {
  return PLAN_MULTIPLIERS[plan ?? "starter"];
}

function getIntentBonus(intent?: string): number {
  return INTENT_BONUS[intent ?? "USER"] ?? 1.0;
}

function getSurgeBonus(surgeActive?: boolean): number {
  return surgeActive ? 1.35 : 1.0;
}

// ── Main Pricing Engine ───────────────────────────────────────────────────────

export function calculateLeadPrice({
  lead,
  contractor,
  cityRow,
  systemMetrics,
}: PricingInput): PricingResult {

  const score             = clamp(Number(lead?.score ?? 1), 1, 10);
  const capacity          = safePositive(cityRow?.capacity, 1);
  const active            = Math.max(Number(cityRow?.active_contractors) || 0, 0);
  const market            = cityRow?.market ?? "unknown";

  const baseValue         = getBaseValue(score);
  const demandMultiplier  = clamp(Number(systemMetrics?.demandMultiplier ?? 1), 0.5, 3);
  const contractorMultiplier = getPlanMultiplier(contractor?.plan);
  const scarcity          = getScarcityFactor(active, capacity);
  const surgeBonus        = getSurgeBonus(systemMetrics?.surgeActive);
  const intentBonus       = getIntentBonus(lead?.intent);

  const raw =
    baseValue *
    demandMultiplier *
    contractorMultiplier *
    scarcity *
    surgeBonus *
    intentBonus;

  const rounded     = Math.round(raw);
  const finalPrice  = clamp(rounded, MIN_PRICE, MAX_PRICE);
  const capped      = rounded > MAX_PRICE;

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

// ── Audit Helper (call from billing workflow) ─────────────────────────────────

export function formatPricingAudit(result: PricingResult): string {
  const { breakdown: b, finalPrice, capped } = result;
  return [
    `[pricing audit]`,
    `  market       : ${b.market}`,
    `  score        : ${b.score}`,
    `  base value   : $${b.baseValue}`,
    `  demand       
