const stripe = require("../../lib/stripe");
const supabase = require("../../lib/supabase");

/* ===============================
   GET STRIPE CUSTOMER
=============================== */
async function getStripeCustomer(authId) {
  if (!authId) throw new Error("authId is required");

  const { data, error } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("auth_id", authId)
    .maybeSingle();

  if (error) {
    console.error("Supabase error (getStripeCustomer):", error);
    throw new Error("Failed to fetch user from database");
  }

  if (!data?.stripe_customer_id) {
    throw new Error("User has no Stripe customer linked");
  }

  return data.stripe_customer_id;
}

/* ===============================
   GET ACTIVE SUBSCRIPTION
=============================== */
async function getActiveSubscription(customerId) {
  try {
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    return subs?.data?.[0] || null;
  } catch (err) {
    console.error("Stripe list subscription error:", err);
    throw new Error("Failed to fetch Stripe subscription");
  }
}

/* ===============================
   CANCEL SUBSCRIPTION
=============================== */
async function cancelSubscription(authId) {
  if (!authId) {
    throw new Error("authId is required");
  }

  /* ===============================
     1. CUSTOMER
  =============================== */
  const customerId = await getStripeCustomer(authId);

  /* ===============================
     2. ACTIVE SUB
  =============================== */
  const subscription = await getActiveSubscription(customerId);

  if (!subscription) {
    return {
      success: true,
      status: "no_subscription",
      message: "No active subscription found",
    };
  }

  /* ===============================
     3. CANCEL STRIPE
  =============================== */
  let canceled;
  try {
    canceled = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });
  } catch (err) {
    console.error("Stripe cancellation error:", err);
    throw new Error("Failed to cancel Stripe subscription");
  }

  if (!canceled?.id) {
    throw new Error("Invalid Stripe response during cancellation");
  }

  /* ===============================
     4. UPDATE SUPABASE
  =============================== */
  const { error } = await supabase
    .from("users")
    .update({
      status: "canceling",
      subscription_status: "canceling",
      subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    })
    .eq("auth_id", authId);

  if (error) {
    console.error("Supabase update error:", error);
    throw new Error("Failed to update subscription state in database");
  }

  /* ===============================
     5. RETURN
  =============================== */
  return {
    success: true,
    status: "canceling",
    subscriptionId: subscription.id,
    message: "Subscription will cancel at end of billing period",
  };
}

/* ===============================
   EXPORT
=============================== */
module.exports = {
  cancelSubscription,
};