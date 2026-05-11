"use client";

import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim();

export default function Home() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    // Prevent double clicks
    if (loading) return;

    if (!API_URL) {
      alert("System configuration error");
      return;
    }

    try {
      setLoading(true);

      /* ===============================
         CREATE LEAD + STRIPE SESSION
      =============================== */
      const response = await fetch(
        `${API_URL}/api/leads`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: "test@example.com",
            name: "Test User",
            city: "Calgary",
            phone: null,
          }),
        }
      );

      /* ===============================
         SAFE JSON PARSE
      =============================== */
      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid server response");
      }

      /* ===============================
         VALIDATE RESPONSE
      =============================== */
      if (!response.ok) {
        throw new Error(
          data?.error || "Checkout failed"
        );
      }

      const checkoutUrl = data?.checkout?.url;
      const leadId = data?.checkout?.leadId;

      if (!checkoutUrl || !leadId) {
        throw new Error(
          "Missing checkout session data"
        );
      }

      /* ===============================
         STORE LEAD FOR WEBHOOK MATCHING
      =============================== */
      localStorage.setItem("leadId", leadId);

      /* ===============================
         REDIRECT TO STRIPE
      =============================== */
      window.location.assign(checkoutUrl);

    } catch (err) {
      console.error("❌ Checkout Error:", err);

      alert(
        err?.message ||
        "Something went wrong"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        padding: 40,
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h1>NorthSky Flow OS</h1>

      <p>
        Automate leads. Collect payments.
        Scale fast.
      </p>

      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          marginTop: 20,
          padding: "12px 24px",
          background: loading
            ? "#6b7280"
            : "#22c55e",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: loading
            ? "not-allowed"
            : "pointer",
          fontSize: 16,
          fontWeight: 600,
          minWidth: 180,
        }}
      >
        {loading
          ? "Redirecting..."
          : "Get Access"}
      </button>
    </main>
  );
}