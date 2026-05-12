"use client";

import { useMemo, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useForm } from "@formspree/react";

const FORM_ID = "xkoyyaej";

/* -----------------------------
   TELEGRAM (SECURE VERSION)
------------------------------*/
const TG_TOKEN = process.env.NEXT_PUBLIC_TG_TOKEN!;
const TG_CHAT_ID = process.env.NEXT_PUBLIC_TG_CHAT_ID!;

const sendTelegram = async (text: string) => {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text,
          parse_mode: "Markdown",
        }),
      }
    );

    const data = await res.json();

    if (!data.ok) {
      console.error("Telegram API error:", data);
    }
  } catch (err) {
    console.error("Telegram network error:", err);
  }
};

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

  /* -----------------------------
     TRACK EVENTS
  ------------------------------*/
  const trackEvent = async (event: string, data?: any) => {
    await fetch(`https://formspree.io/f/${FORM_ID}`, {
      method: "POST",
      body: JSON.stringify({ event, data }),
      headers: { "Content-Type": "application/json" },
    });
  };

  /* -----------------------------
     CHECKOUT FLOW
  ------------------------------*/
  const checkout = async (planId: string) => {
    if (loadingPlan) return;

    setError("");
    setLoadingPlan(planId);

    try {
      await trackEvent("checkout_click", { planId });

      await sendTelegram(`💰 Checkout Click\nPlan: ${planId}`);

      const res = await api("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          email: "test@example.com",
          name: "Test User",
          city: "Calgary",
        }),
      });

      const url = res?.checkout?.url || res?.url;

      if (!url) throw new Error("No checkout URL");

      await sendTelegram(`🚀 Redirecting checkout\nPlan: ${planId}`);

      window.location.assign(url);
    } catch (err: any) {
      setError(err?.message || "Checkout failed");

      await sendTelegram(
        `❌ Checkout Error\nPlan: ${planId}\nError: ${err?.message}`
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  /* -----------------------------
     FORMS (WAITLIST + CONTACT)
  ------------------------------*/
  const handleWaitlist = async (e: any) => {
    await handleWaitlistSubmit(e);

    await sendTelegram(`🚀 Waitlist Signup\nEmail: ${e.target.email.value}`);
  };

  const handleContact = async (e: any) => {
    await handleContactSubmit(e);

    await sendTelegram(`📩 Contact Message\nEmail: ${e.target.email.value}`);
  };

  /* -----------------------------
     EXIT INTENT
  ------------------------------*/
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.clientY < 10) setShowPopup(true);
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
        >
          Start Building
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

            <button onClick={() => checkout(p.id)} style={styles.btn}>
              {p.cta}
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

      {/* POPUP */}
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