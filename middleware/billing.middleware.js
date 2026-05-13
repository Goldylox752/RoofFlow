const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ===============================
   PLAN HIERARCHY
=============================== */
const PLAN_HIERARCHY = {
  starter: 1,
  growth: 2,
  elite: 3,
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

/* ===============================
   SAFE PLAN NORMALIZER
=============================== */
const normalizePlan = (plan) => {
  if (!plan || typeof plan !== "string") return "starter";
  return plan.toLowerCase();
};

/* ===============================
   BILLING MIDDLEWARE
=============================== */
module.exports = function billing(requiredPlan = "starter") {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user?.id) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      /* ===============================
         FETCH SUBSCRIPTION STATE
      =============================== */
      const { data: sub, error } = await supabase
        .from("subscriptions")
        .select("plan, status, active")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({
          success: false,
          error: "Subscription lookup failed",
        });
      }

      if (!sub) {
        return res.status(403).json({
          success: false,
          error: "No subscription found",
        });
      }

      /* ===============================
         STATUS VALIDATION
      =============================== */
      const status = normalizePlan(sub.status);

      if (!ACTIVE_STATUSES.has(status)) {
        return res.status(403).json({
          success: false,
          error: "Payment required",
        });
      }

      /* ===============================
         PLAN VALIDATION
      =============================== */
      const userPlan = normalizePlan(sub.plan);
      const userLevel = PLAN_HIERARCHY[userPlan] || 0;
      const requiredLevel = PLAN_HIERARCHY[requiredPlan] || 1;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          error: "Upgrade required",
          currentPlan: userPlan,
          requiredPlan,
        });
      }

      /* ===============================
         ATTACH BILLING CONTEXT
      =============================== */
      req.billing = {
        plan: userPlan,
        status,
        active: Boolean(sub.active),
      };

      next();
    } catch (err) {
      console.error("Billing middleware crash:", err);

      return res.status(500).json({
        success: false,
        error: "Billing system error",
      });
    }
  };
};