import Stripe from "stripe";

/**
 * Stripe client (server-side only)
 * Uses secret key from environment variables
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

/**
 * Helper: create payment intent
 */
export async function createPaymentIntent({
  amount,
  currency = "usd",
  customerId,
  metadata = {},
}) {
  return stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata,
  });
}

/**
 * Helper: retrieve customer
 */
export async function getCustomer(customerId) {
  return stripe.customers.retrieve(customerId);
}

/**
 * Helper: create customer
 */
export async function createCustomer({ email, name }) {
  return stripe.customers.create({
    email,
    name,
  });
}

/**
 * Helper: construct webhook event safely
 */
export function constructStripeEvent(req, signature) {
  return stripe.webhooks.constructEvent(
    req.body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}