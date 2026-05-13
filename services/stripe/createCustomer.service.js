const stripe = require("../../lib/stripe");
const supabase = require("../../lib/supabase");

/* ===============================
   GET OR CREATE STRIPE CUSTOMER
   (IDEMPOTENT + PRO SAFE)
=============================== */
exports.getOrCreateStripeCustomer = async (user) => {
  const authId = user?.id;
  const email = user?.email;

  if (!authId || !email) {
    throw new Error("Invalid user: missing authId or email");
  }

  /* ===============================
     1. FETCH EXISTING CUSTOMER
  =============================== */
  const { data, error } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("auth_id", authId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Supabase fetch error:", error);
    throw new Error("Failed to fetch user");
  }

  const existingCustomerId = data?.stripe_customer_id;

  /* ===============================
     2. RETURN IF EXISTS
  =============================== */
  if (existingCustomerId) {
    return existingCustomerId;
  }

  /* ===============================
     3. CREATE STRIPE CUSTOMER (SAFE)
  =============================== */
  const customer = await stripe.customers.create({
    email,
    metadata: {
      auth_id: authId,
    },
  });

  if (!customer?.id) {
    throw new Error("Stripe customer creation failed");
  }

  /* ===============================
     4. UPDATE DATABASE (ATOMIC STYLE)
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
    console.error("Supabase update error:", updateError);
    throw new Error("Failed to persist Stripe customer mapping");
  }

  return customer.id;
};