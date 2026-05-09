const FEATURES = require("../config/feature.config");

module.exports = function feature(featureName) {
  return (req, res, next) => {
    const billing = req.billing;

    if (!billing?.plan) {
      return res.status(403).json({
        success: false,
        error: "No billing context",
      });
    }

    const planFeatures = FEATURES[billing.plan] || {};

    const allowed = planFeatures[featureName];

    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: `Feature not available: ${featureName}`,
      });
    }

    next();
  };
};