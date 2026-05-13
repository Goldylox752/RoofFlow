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

/* ===============================
   SAFE PLAN RESOLUTION
=============================== */
const normalizePlan = (plan) => {
  if (!plan || typeof plan !== "string") return "starter";
  return plan.toLowerCase();
};

/* ===============================
   GET PLAN FEATURES
=============================== */
const getPlan = (plan) => {
  const normalized = normalizePlan(plan);
  return FEATURES[normalized] || FEATURES.starter;
};

/* ===============================
   FEATURE CHECK (CORE LOGIC)
=============================== */
const hasFeature = (plan, feature) => {
  const planFeatures = getPlan(plan);
  return planFeatures?.[feature] === true;
};

/* ===============================
   REQUIRED FEATURE GUARD
   (USE IN MIDDLEWARE)
=============================== */
const requireFeature = (feature) => {
  return (req, res, next) => {
    const plan = req.user?.plan;

    if (!hasFeature(plan, feature)) {
      return res.status(403).json({
        success: false,
        error: `Feature "${feature}" requires upgrade`,
        plan,
      });
    }

    next();
  };
};

module.exports = {
  FEATURES,
  getPlan,
  hasFeature,
  requireFeature,
};