const supabase = require("../lib/supabase");

/**
 * SUBSCRIPTION MIDDLEWARE
 * Blocks access unless user has an active subscription
 */
module.exports = async function requireSubscription(req, res, next) {
  try {
    const userId = req.user?.id;

    // Must run AFTER auth middleware
    if (!userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("plan, status, stripe_customer_id")
      .eq("auth_id", userId)
      .single();

    if (error || !user) {
      return res.status(403).json({ error: "user_not_found" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ error: "subscription_inactive" });
    }

    // Attach subscription data to request
    req.subscription = {
      plan: user.plan,
      status: user.status,
      stripe_customer_id: user.stripe_customer_id,
    };

    next();
  } catch (err) {
    console.error("requireSubscription error:", err);

    return res.status(500).json({ error: "server_error" });
  }
};