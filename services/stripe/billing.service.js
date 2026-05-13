const stripe = require("../../lib/stripe");
const supabase = require("../../lib/supabase");

/* ===============================
   GET STRIPE CUSTOMER
=============================== */
async function getStripeCustomer(authId) {
  const { data, error } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("auth_id", authId)
    .single();

  if (error) {
    console.error("Supabase error:", error);
    throw new Error("Failed to fetch user");
  }

  if (!data?.stripe_customer_id) {
    throw new Error("User has no Stripe customer");
  }

  return data.stripe_customer_id;
}

/* ===============================
   GET ACTIVE SUBSCRIPTION
=============================== */
async function getActiveSubscription(customerId) {
  const { data } = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  return data?.[0] || null;
}

/* ===============================
   CANCEL SUBSCRIPTION (SAFETY VERSION)
=============================== */
exports.cancelSubscription = async (authId) => {
  if (!authId) {
    throw new Error("authId is required");
  }

  // 1. Get Stripe customer
  const customerId = await getStripeCustomer(authId);

  // 2. Find active subscription
  const subscription = await getActiveSubscription(customerId);

  if (!subscription) {
    return {
      success: true,
      status: "no_subscription",
      message: "No active subscription found",
    };
  }

  // 3. Cancel at period end (safe billing behavior)
  const canceled = await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
  });

  if (!canceled) {
    throw new Error("Stripe cancellation failed");
  }

  // 4. Update Supabase user status
  const { error } = await supabase
    .from("users")
    .update({
      status: "canceled",
      subscription_status: "canceling",
      subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    })
    .eq("auth_id", authId);

  if (error) {
    console.error("Supabase update error:", error);
    throw new Error("Failed to update user subscription status");
  }

  return {
    success: true,
    status: "canceling",
    subscriptionId: subscription.id,
    message: "Subscription will cancel at end of billing period",
  };
};