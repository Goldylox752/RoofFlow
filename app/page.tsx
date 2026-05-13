"use client";

import { useMemo, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useForm } from "@formspree/react";

const FORM_ID = "xkoyyaej";

const plans = [
  { id: "starter", name: "Starter", price: "$9/mo", cta: "Start Starter" },
  { id: "growth", name: "Growth", price: "$29/mo", cta: "Choose Growth", featured: true },
  { id: "elite", name: "Elite", price: "$79/mo", cta: "Go Elite" },
];

export default function Home() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const year = useMemo(() => new Date().getFullYear(), []);

  const [waitlistState, handleWaitlistSubmit] = useForm(FORM_ID);
  const [contactState, handleContactSubmit] = useForm(FORM_ID);

  const trackEvent = async (event: string, data?: any) => {
    try {
      await fetch(`https://formspree.io/f/${FORM_ID}`, {
        method: "POST",
        body: JSON.stringify({ event, data }),
        headers: { "Content-Type": "application/json" },
      });
    } catch {}
  };

  const checkout = async (planId: string) => {
    if (loadingPlan) return;

    setError("");
    setLoadingPlan(planId);

    try {
      await trackEvent("checkout_click", { planId });

      /* ===============================
         CALL YOUR REAL BACKEND
      =============================== */
      const res = await api("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
        }),
      });

      const url = res?.url;

      if (!url) {
        throw new Error("No checkout URL returned");
      }

      window.location.href = url;
    } catch (err: any) {
      setError(err?.message || "Checkout failed");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleWaitlist = async (e: any) => {
    await handleWaitlistSubmit(e);
  };

  const handleContact = async (e: any) => {
    await handleContactSubmit(e);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.clientY <= 5) setShowPopup(true);
    };

    window.addEventListener("mouseout", handler);
    return () => window.removeEventListener("mouseout", handler);
  }, []);

  return (
    <main style={styles.main}>

      {/* HERO */}
      <section style={styles.hero}>
        <h1 style={styles.h1}>Launch SaaS faster</h1>

        <button
          style={styles.primaryBtn}
          onClick={() => checkout("starter")}
          disabled={loadingPlan === "starter"}
        >
          {loadingPlan === "starter" ? "Loading..." : "Start Building"}
        </button>
      </section>

      {/* WAITLIST */}
      <section style={styles.section}>
        <h2>Join Waitlist</h2>

        {waitlistState.succeeded ? (
          <p>You're in 🚀</p>
        ) : (
          <form onSubmit={handleWaitlist} style={styles.form}>
            <input name="email" placeholder="Email" style={styles.input} />
            <button type="submit" style={styles.primaryBtn}>
              Join
            </button>
          </form>
        )}
      </section>

      {/* PRICING */}
      <section>
        {plans.map((p) => (
          <div key={p.id} style={styles.card}>
            <h3>{p.name}</h3>
            <p>{p.price}</p>

            <button
              onClick={() => checkout(p.id)}
              style={styles.btn}
              disabled={loadingPlan === p.id}
            >
              {loadingPlan === p.id ? "Processing..." : p.cta}
            </button>
          </div>
        ))}
      </section>

      {/* CONTACT */}
      <section>
        <form onSubmit={handleContact} style={styles.form}>
          <input name="email" placeholder="Email" style={styles.input} />
          <textarea name="message" placeholder="Message" style={styles.textarea} />
          <button type="submit" style={styles.primaryBtn}>
            Send
          </button>
        </form>
      </section>

      {/* EXIT POPUP */}
      {showPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popup}>
            <form onSubmit={handleWaitlist} style={styles.form}>
              <input name="email" placeholder="Email" style={styles.input} />
              <button type="submit" style={styles.primaryBtn}>
                Join Free
              </button>
            </form>
          </div>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <footer>© {year}</footer>
    </main>
  );
}