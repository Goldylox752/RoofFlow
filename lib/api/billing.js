import { safeFetch } from "./client";

/* ===============================
   CREATE PORTAL SESSION
=============================== */
export async function createBillingPortal(email) {
  if (!email) throw new Error("Email is required");

  const data = await safeFetch("/api/billing/portal", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  if (!data?.url) {
    throw new Error("Missing portal URL");
  }

  return data;
}

/* ===============================
   GET CUSTOMER INFO
=============================== */
export async function getCustomer(email) {
  if (!email) throw new Error("Email is required");

  return safeFetch(`/api/billing/customer?email=${encodeURIComponent(email)}`);
}

/* ===============================
   CANCEL SUBSCRIPTION
=============================== */
export async function cancelSubscription(email) {
  if (!email) throw new Error("Email is required");

  return safeFetch("/api/billing/cancel", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}