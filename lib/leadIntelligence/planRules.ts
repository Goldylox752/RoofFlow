export const PLAN_RULES = {
  starter: {
    stripeLink: "aFaeV6cX97yIfsjcvu2ZO0E",
    max_agents: 1,
    maxLeadsPerDay: 20,
    priority: 3,
    routing_mode: "basic_round_robin",
  },

  pro: {
    stripeLink: "dRm28k8GTaKU1Btcvu2ZO0D",
    max_agents: 5,
    maxLeadsPerDay: 100,
    priority: 2,
    routing_mode: "balanced",
  },

  elite: {
    stripeLink: "dRmfZae1d2eoeofgLK2ZO0C",
    max_agents: 20,
    maxLeadsPerDay: 999,
    priority: 1,
    routing_mode: "ai_priority",
  },
};