export type PlanName =
  | "starter"
  | "pro"
  | "elite";

export type RoutingMode =
  | "basic_round_robin"
  | "balanced"
  | "ai_priority";

export interface PlanRule {
  name: PlanName;

  /* ===============================
     BILLING
  =============================== */
  stripePriceId: string;
  stripePaymentLink: string;

  /* ===============================
     LIMITS
  =============================== */
  maxAgents: number;
  maxLeadsPerDay: number;
  maxActiveJobs: number;

  /* ===============================
     PRIORITY
     Lower number = higher priority
  =============================== */
  priority: number;

  /* ===============================
     ROUTING
  =============================== */
  routingMode: RoutingMode;

  /* ===============================
     FEATURES
  =============================== */
  features: {
    aiDispatch: boolean;
    leadScoring: boolean;
    analytics: boolean;
    apiAccess: boolean;
    webhookAccess: boolean;
    prioritySupport: boolean;
    whiteLabel: boolean;
  };

  /* ===============================
     RATE LIMITING
  =============================== */
  limits: {
    requestsPerMinute: number;
    concurrentDispatches: number;
  };
}

export const PLAN_RULES: Record<
  PlanName,
  PlanRule
> = {
  starter: {
    name: "starter",

    /* BILLING */
    stripePriceId:
      process.env
        .STRIPE_STARTER_PRICE_ID || "",

    stripePaymentLink:
      process.env
        .STRIPE_STARTER_LINK ||
      "aFaeV6cX97yIfsjcvu2ZO0E",

    /* LIMITS */
    maxAgents: 1,
    maxLeadsPerDay: 20,
    maxActiveJobs: 5,

    /* PRIORITY */
    priority: 3,

    /* ROUTING */
    routingMode:
      "basic_round_robin",

    /* FEATURES */
    features: {
      aiDispatch: false,
      leadScoring: true,
      analytics: false,
      apiAccess: false,
      webhookAccess: false,
      prioritySupport: false,
      whiteLabel: false,
    },

    /* RATE LIMITS */
    limits: {
      requestsPerMinute: 30,
      concurrentDispatches: 1,
    },
  },

  pro: {
    name: "pro",

    /* BILLING */
    stripePriceId:
      process.env
        .STRIPE_PRO_PRICE_ID || "",

    stripePaymentLink:
      process.env
        .STRIPE_PRO_LINK ||
      "dRm28k8GTaKU1Btcvu2ZO0D",

    /* LIMITS */
    maxAgents: 5,
    maxLeadsPerDay: 100,
    maxActiveJobs: 25,

    /* PRIORITY */
    priority: 2,

    /* ROUTING */
    routingMode: "balanced",

    /* FEATURES */
    features: {
      aiDispatch: true,
      leadScoring: true,
      analytics: true,
      apiAccess: false,
      webhookAccess: true,
      prioritySupport: true,
      whiteLabel: false,
    },

    /* RATE LIMITS */
    limits: {
      requestsPerMinute: 120,
      concurrentDispatches: 5,
    },
  },

  elite: {
    name: "elite",

    /* BILLING */
    stripePriceId:
      process.env
        .STRIPE_ELITE_PRICE_ID || "",

    stripePaymentLink:
      process.env
        .STRIPE_ELITE_LINK ||
      "dRmfZae1d2eoeofgLK2ZO0C",

    /* LIMITS */
    maxAgents: 20,
    maxLeadsPerDay: 999,
    maxActiveJobs: 250,

    /* PRIORITY */
    priority: 1,

    /* ROUTING */
    routingMode: "ai_priority",

    /* FEATURES */
    features: {
      aiDispatch: true,
      leadScoring: true,
      analytics: true,
      apiAccess: true,
      webhookAccess: true,
      prioritySupport: true,
      whiteLabel: true,
    },

    /* RATE LIMITS */
    limits: {
      requestsPerMinute: 1000,
      concurrentDispatches: 25,
    },
  },
};

/* =========================================================
   HELPERS
========================================================= */

export function getPlanRules(
  plan?: string
): PlanRule {
  return (
    PLAN_RULES[
      (plan || "starter") as PlanName
    ] || PLAN_RULES.starter
  );
}

export function canAcceptLead(
  plan: string,
  todaysLeadCount: number
) {
  const rules = getPlanRules(plan);

  return (
    todaysLeadCount <
    rules.maxLeadsPerDay
  );
}

export function canCreateAgent(
  plan: string,
  currentAgents: number
) {
  const rules = getPlanRules(plan);

  return (
    currentAgents <
    rules.maxAgents
  );
}

export function hasFeature(
  plan: string,
  feature: keyof PlanRule["features"]
) {
  const rules = getPlanRules(plan);

  return !!rules.features[feature];
}

export function getRoutingMode(
  plan: string
): RoutingMode {
  return getPlanRules(plan)
    .routingMode;
}