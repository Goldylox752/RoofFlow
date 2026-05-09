const stripe = require("../../lib/stripe");
const supabase = require("../../lib/supabase");

/* ===============================
   GET USER STRIPE CUSTOMER
=============================== */
async function getStripeCustomer(authId) {
  const { data, error } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("auth_id", authId)
    .maybeSingle();

  if (error) {
    throw new Error("Database error fetching user");
  }

  if (!data?.stripe_customer_id) {
    throw new Error("Stripe customer not found");
  }

  return data.stripe_customer_id;
}

/* ===============================
   CANCEL SUBSCRIPTION (AUTH BASED)
=============================== */
exports.cancelSubscription = async (authId) => {
  if (!authId) throw new Error("Missing auth_id");

  const customerId = await getStripeCustomer(authId);

  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });

  const subscription = subs.data[0];

  if (!subscription) {
    return {
      success: true,
      message: "No active subscription",
    };
  }

  await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
  });

  const { error } = await supabase
    .from("users")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("auth_id", authId);

  if (error) {
    throw new Error("Failed to update user status");
  }

  return {
    success: true,
    message: "Subscription will cancel at period end",
  };
};