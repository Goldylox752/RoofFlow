"use client";

import { useMemo, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useForm } from "@formspree/react";

const FORM_ID = "xkoyyaej";

/* -----------------------------
   TELEGRAM CONFIG
------------------------------*/
const TG_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN";
const TG_CHAT_ID = "YOUR_CHAT_ID";

const sendTelegram = async (text: string) => {
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
    });
  } catch (e) {
    console.log("Telegram error", e);
  }
};

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$9/mo",
    description: "Perfect for validating ideas quickly",
    cta: "Start Starter",
  },
  {
    id: "growth",
    name: "Growth",
    price: "$29/mo",
    description: "Best for launching real SaaS products",
    cta: "Choose Growth",
    featured: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: "$79/mo",
    description: "Scale automation, teams, and workflows",
    cta: "Go Elite",
  },
];

export default function Home() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const year = useMemo(() => new Date().getFullYear(), []);

  const [waitlistState, handleWaitlistSubmit] = useForm(FORM_ID);
  const [contactState, handleContactSubmit] = useForm(FORM_ID);

  /* -----------------------------
     TRACK EVENTS (FORMSPREE)
  ------------------------------*/
  const trackEvent = async (event: string, data?: any) => {
    const formData = new FormData();
    formData.append("name", "Analytics Event");
    formData.append("email", "system@analytics.local");
    formData.append("message", JSON.stringify({ event, data }));
    formData.append("source", "analytics");

    await fetch(`https://formspree.io/f/${FORM_ID}`, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });
  };

  /* -----------------------------
     FALLBACK LEAD LOG
  ------------------------------*/
  const logLead = async (planId: string) => {
    const formData = new FormData();
    formData.append("name", "Checkout Lead");
    formData.append("email", "test@example.com");
    formData.append("message", `Plan selected: ${planId}`);
    formData.append("source", "checkout_fallback");

    await fetch(`https://formspree.io/f/${FORM_ID}`, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });
  };

  /* -----------------------------
     EXIT INTENT POPUP
  ------------------------------*/
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.clientY < 10) setShowPopup(true);
    };

    window.addEventListener("mouseout", handler);
    return () => window.removeEventListener("mouseout", handler);
  }, []);

  /* -----------------------------
     CHECKOUT FLOW
  ------------------------------*/
  const checkout = async (planId: string) => {
    if (loadingPlan) return;

    setError("");
    setLoadingPlan(planId);

    try {
      await trackEvent("checkout_click", { planId });

      await sendTelegram(
        `💰 *Checkout Click*\nPlan: ${planId}`
      );

      await logLead(planId);

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

      await trackEvent("checkout_redirect", { planId });

      await sendTelegram(
        `🚀 Redirecting checkout\nPlan: ${planId}`
      );

      window.location.assign(url);
    } catch (err: any) {
      await trackEvent("checkout_error", { planId, error: err?.message });

      await sendTelegram(
        `❌ Checkout Error\nPlan: ${planId}\nError: ${err?.message}`
      );

      setError(err?.message || "Checkout failed");
    } finally {
      setLoadingPlan(null);
    }
  };

  /* -----------------------------
     WRAPPED FORMS
  ------------------------------*/
  const handleWaitlist = async (e: any) => {
    await handleWaitlistSubmit(e);

    await sendTelegram(
      `🚀 *Waitlist Signup*\nEmail: ${e.target.email.value}`
    );
  };

  const handleContact = async (e: any) => {
    await handleContactSubmit(e);

    await sendTelegram(
      `📩 *Contact Message*\nEmail: ${e.target.email.value}`
    );
  };

  return (
    <main style={styles.main}>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.badge}>AI SaaS Infrastructure Platform</div>

        <h1 style={styles.h1}>
          Launch SaaS products without backend complexity
        </h1>

        <div style={styles.ctaRow}>
          <button style={styles.primaryBtn} onClick={() => checkout("starter")}>
            Start Building
          </button>
        </div>
      </section>

      {/* WAITLIST */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Join the Waitlist</h2>

        {waitlistState.succeeded ? (
          <p style={{ color: "green" }}>You're on the list 🚀</p>
        ) : (
          <form onSubmit={handleWaitlist} style={styles.form}>
            <input name="email" placeholder="Email" style={styles.input} />
            <input type="hidden" name="source" value="waitlist" />

            <button type="submit" style={styles.primaryBtn}>
              Join
            </button>
          </form>
        )}
      </section>

      {/* PRICING */}
      <section id="pricing" style={styles.pricing}>
        <h2 style={styles.sectionTitle}>Pricing</h2>

        {plans.map((plan) => (
          <div key={plan.id} style={styles.card}>
            <h3>{plan.name}</h3>
            <p>{plan.price}</p>

            <button onClick={() => checkout(plan.id)} style={styles.btn}>
              {plan.cta}
            </button>
          </div>
        ))}
      </section>

      {/* CONTACT */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Contact</h2>

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
            <h2>Wait!</h2>

            <form onSubmit={handleWaitlist} style={styles.form}>
              <input name="email" placeholder="Email" style={styles.input} />
              <button type="submit" style={styles.primaryBtn}>
                Join Free
              </button>
            </form>

            <button onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && <div style={styles.error}>{error}</div>}

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div>© {year} SaaS OS</div>
      </footer>
    </main>
  );
}