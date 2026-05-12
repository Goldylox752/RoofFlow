"use client";

import { useMemo, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useForm, ValidationError } from "@formspree/react";

const FORM_ID = "xkoyyaej";

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
     EVENT TRACKING (FORMSPREE LOG)
  ------------------------------*/
  const trackEvent = async (event: string, data?: any) => {
    const formData = new FormData();
    formData.append("name", "Analytics Event");
    formData.append("email", "system@analytics.local");
    formData.append(
      "message",
      JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
      })
    );
    formData.append("source", "analytics");

    await fetch(`https://formspree.io/f/${FORM_ID}`, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });
  };

  /* -----------------------------
     LEAD FALLBACK LOG (CHECKOUT)
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
     CHECKOUT FLOW (TRACKED)
  ------------------------------*/
  const checkout = async (planId: string) => {
    if (loadingPlan) return;

    setError("");
    setLoadingPlan(planId);

    try {
      await trackEvent("checkout_click", { planId });
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

      const checkoutUrl =
        res?.checkout?.url ||
        res?.checkout?.sessionUrl ||
        res?.url;

      if (!checkoutUrl) throw new Error("No checkout URL");

      await trackEvent("checkout_redirect", { planId });

      window.location.assign(checkoutUrl);
    } catch (err: any) {
      await trackEvent("checkout_error", {
        planId,
        error: err?.message,
      });

      setError(err?.message || "Checkout failed");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main style={styles.main}>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.badge}>AI SaaS Infrastructure Platform</div>

        <h1 style={styles.h1}>
          Launch SaaS products without backend complexity
        </h1>

        <p style={styles.subHero}>
          Auth, Stripe, workflows, and automation — already built.
        </p>

        <div style={styles.ctaRow}>
          <button
            style={styles.primaryBtn}
            onClick={() => checkout("starter")}
          >
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
          <form onSubmit={handleWaitlistSubmit} style={styles.form}>
            <input name="name" placeholder="Name" style={styles.input} />
            <input name="email" placeholder="Email" required style={styles.input} />
            <input type="hidden" name="source" value="waitlist" />

            <button type="submit" style={styles.primaryBtn}>
              Join Waitlist
            </button>
          </form>
        )}
      </section>

      {/* FEATURES */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Everything you need</h2>
        <div style={styles.grid}>
          <div style={styles.card}>Authentication</div>
          <div style={styles.card}>Stripe Billing</div>
          <div style={styles.card}>Automation Engine</div>
          <div style={styles.card}>Production Ready</div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={styles.pricing}>
        <h2 style={styles.sectionTitle}>Pricing</h2>

        <div style={styles.pricingGrid}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={plan.featured ? styles.highlightCard : styles.card}
            >
              <h3>{plan.name}</h3>
              <p>{plan.price}</p>
              <p>{plan.description}</p>

              <button
                style={styles.btn}
                onClick={() => checkout(plan.id)}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Contact</h2>

        {contactState.succeeded ? (
          <p style={{ color: "green" }}>Message sent</p>
        ) : (
          <form onSubmit={handleContactSubmit} style={styles.form}>
            <input name="name" placeholder="Name" style={styles.input} />
            <input name="email" placeholder="Email" style={styles.input} />
            <textarea name="message" placeholder="Message" style={styles.textarea} />

            <button type="submit" style={styles.primaryBtn}>
              Send
            </button>
          </form>
        )}
      </section>

      {/* EXIT POPUP */}
      {showPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popup}>
            <h2>Wait!</h2>
            <p>Get early access updates</p>

            <form onSubmit={handleWaitlistSubmit} style={styles.form}>
              <input name="email" placeholder="Email" style={styles.input} />
              <input type="hidden" name="source" value="exit_popup" />

              <button type="submit" style={styles.primaryBtn}>
                Join Free
              </button>
            </form>

            <button onClick={() => setShowPopup(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div>© {year} SaaS OS</div>
      </footer>
    </main>
  );
}