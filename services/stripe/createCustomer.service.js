const stripe = require("../../lib/stripe");
const supabase = require("../../lib/supabase");

/* ===============================
   GET OR CREATE STRIPE CUSTOMER
   (AUTH-BASED SINGLE SOURCE OF TRUTH)
=============================== */
exports.getOrCreateStripeCustomer = async (user) => {
  const { id: authId, email } = user;

  if (!authId || !email) {
    throw new Error("Missing auth user data");
  }

  /* ===============================
     1. CHECK EXISTING CUSTOMER
  =============================== */
  const { data: existing, error } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("auth_id", authId)
    .maybeSingle();

  if (error) {
    throw new Error("Database error while fetching user");
  }

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  /* ===============================
     2. CREATE STRIPE CUSTOMER
  =============================== */
  const customer = await stripe.customers.create({
    email,
    metadata: {
      auth_id: authId,
    },
  });

  if (!customer?.id) {
    throw new Error("Failed to create Stripe customer");
  }

  /* ===============================
     3. SAVE TO DATABASE
  =============================== */
  const { error: updateError } = await supabase
    .from("users")
    .update({
      stripe_customer_id: customer.id,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("auth_id", authId);

  if (updateError) {
    throw new Error("Failed to save Stripe customer mapping");
  }

  return customer.id;
};