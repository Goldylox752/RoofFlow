// =====================
// CONFIG
// =====================
const API = process.env.NEXT_PUBLIC_API_URL;

if (typeof window !== "undefined" && !API) {
  console.warn("⚠️ Missing NEXT_PUBLIC_API_URL");
}

const BASE_URL = API ? API.replace(/\/$/, "") : "";

// =====================
// TOKEN HELPERS
// =====================
function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

// =====================
// SAFE JSON PARSE
// =====================
async function safeParse(res) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  return res.text();
}

// =====================
// CORE FETCH WRAPPER (UPGRADED)
// =====================
async function apiFetch(path, options = {}) {
  if (!BASE_URL) {
    throw new Error("API base URL is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 10000);

  const token = getToken();

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      body: options.body || undefined,
      signal: controller.signal,
    });

    const data = await safeParse(res);

    clearTimeout(timeout);

    if (!res.ok) {
      const message =
        (data && data.message) ||
        data?.error ||
        `Request failed (${res.status})`;

      const error = new Error(message);
      error.status = res.status;
      error.data = data;

      throw error;
    }

    return data;
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "AbortError") {
      throw new Error("⏱ Request timeout — server not responding");
    }

    throw err;
  }
}

// =====================
// LEADS
// =====================
export const createLead = (payload) =>
  apiFetch("/api/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getLeads = () => apiFetch("/api/leads");

// =====================
// SCORING
// =====================
export const scoreLead = (payload) =>
  apiFetch("/api/score", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// =====================
// STRIPE
// =====================
export const createCheckoutSession = (payload) =>
  apiFetch("/api/payments/create-session", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// =====================
// BILLING PORTAL (ADDED)
// =====================
export const openBillingPortal = (email) =>
  apiFetch("/api/billing/portal", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

// =====================
// HEALTH CHECK
// =====================
export const checkHealth = () => apiFetch("/");