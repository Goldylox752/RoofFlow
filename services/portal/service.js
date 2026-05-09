const stripe = require("../../lib/stripe");
const supabase = require("../../lib/supabase");
const normalizeEmail = require("../utils/normalizeEmail");

/* ===============================
   GET CUSTOMER BY EMAIL
=============================== */
async function getCustomer(email) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) throw new Error("Missing email");

  const { data, error } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (error || !data?.stripe_customer_id) {
    throw new Error("Customer not found");
  }

  return data.stripe_customer_id;
}

/* ===============================
   PORTAL SESSION
=============================== */
exports.createPortalSession = async (email) => {
  const customerId = await getCustomer(email);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.FRONTEND_URL}/dashboard`,
  });

  return {
    success: true,
    url: session.url,
  };
};

/* ===============================
   CANCEL SUBSCRIPTION
=============================== */
exports.cancelSubscription = async (email) => {
  const customerId = await getCustomer(email);

  const subs = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
  });

  if (!subs.data.length) {
    return {
      success: true,
      message: "No active subscription",
    };
  }

  await stripe.subscriptions.update(subs.data[0].id, {
    cancel_at_period_end: true,
  });

  await supabase
    .from("users")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  return {
    success: true,
    message: "Subscription will cancel at period end",
  };
};