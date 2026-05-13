const FEATURES = {
  starter: {
    ai_scoring: true,
    lead_export: false,
    priority_routing: false,
    api_access: false,
  },

  growth: {
    ai_scoring: true,
    lead_export: true,
    priority_routing: true,
    api_access: false,
  },

  elite: {
    ai_scoring: true,
    lead_export: true,
    priority_routing: true,
    api_access: true,
  },
};

/**
 * Check if a plan has a feature enabled
 */
function hasFeature(plan, feature) {
  return Boolean(FEATURES?.[plan]?.[feature]);
}

/**
 * Get all features for a plan safely
 */
function getFeatures(plan) {
  return FEATURES?.[plan] || {};
}

module.exports = {
  FEATURES,
  hasFeature,
  getFeatures,
};