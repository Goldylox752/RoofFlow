export const PLAN_QUOTAS = {
  free: {
    ai_tokens: 25000,
    leads: 25,
    sms: 0,
  },

  starter: {
    ai_tokens: 100000,
    leads: 250,
    sms: 100,
  },

  pro: {
    ai_tokens: 1000000,
    leads: 5000,
    sms: 5000,
  },

  enterprise: {
    ai_tokens: Infinity,
    leads: Infinity,
    sms: Infinity,
  },
};