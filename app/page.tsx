"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";

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
  const [error, setError] = useState<string>("");

  const year = useMemo(() => new Date().getFullYear(), []);

  const checkout = async (planId: string) => {
    if (loadingPlan) return;

    setError("");
    setLoadingPlan(planId);

    try {
      const res = await api("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: planId, // 🔥 now future-proof if backend uses it
          email: "test@example.com",
          name: "Test User",
          city: "Calgary",
          phone: null,
        }),
      });

      const checkoutUrl =
        res?.checkout?.url ||
        res?.checkout?.sessionUrl ||
        res?.url;

      if (!checkoutUrl) {
        throw new Error("Checkout session not returned by server");
      }

      window.location.assign(checkoutUrl);
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err?.message || "Unable to start checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main style={styles.main}>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.badge}>
          AI SaaS Infrastructure Platform
        </div>

        <h1 style={styles.h1}>
          Launch SaaS products without building backend infrastructure
        </h1>

        <p style={styles.subHero}>
          Authentication, Stripe payments, workflows, and automation — already built.
        </p>

        <div style={styles.ctaRow}>
          <button
            style={styles.primaryBtn}
            onClick={() => checkout("starter")}
            disabled={!!loadingPlan}
          >
            {loadingPlan === "starter" ? "Redirecting..." : "Start Building"}
          </button>

          <a href="#pricing" style={styles.secondaryBtn}>
            View Pricing
          </a>
        </div>

        <div style={styles.socialProof}>
          <span>✔ Stripe-secured</span>
          <span>✔ Production-ready</span>
          <span>✔ Cancel anytime</span>
        </div>
      </section>

      {/* ERROR */}
      {error && <div style={styles.error}>{error}</div>}

      {/* FEATURES */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Everything you need to launch</h2>

        <div style={styles.grid}>
          <div style={styles.card}>Authentication system included</div>
          <div style={styles.card}>Stripe payments built-in</div>
          <div style={styles.card}>Automated workflows</div>
          <div style={styles.card}>Production deployment ready</div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>How it works</h2>

        <div style={styles.steps}>
          <div style={styles.card}>1. Choose a plan</div>
          <div style={styles.card}>2. Connect Stripe</div>
          <div style={styles.card}>3. Launch instantly</div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={styles.pricing}>
        <h2 style={styles.sectionTitle}>Simple pricing</h2>

        <div style={styles.pricingGrid}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={plan.featured ? styles.highlightCard : styles.card}
            >
              {plan.featured && (
                <div style={styles.popular}>MOST POPULAR</div>
              )}

              <h3>{plan.name}</h3>
              <p style={styles.price}>{plan.price}</p>
              <p>{plan.description}</p>

              <button
                style={styles.btn}
                onClick={() => checkout(plan.id)}
                disabled={loadingPlan === plan.id}
              >
                {loadingPlan === plan.id ? "Redirecting..." : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={styles.final}>
        <h2>Ship SaaS products faster than ever</h2>
        <button
          style={styles.primaryBtn}
          onClick={() => checkout("growth")}
          disabled={!!loadingPlan}
        >
          Launch Now
        </button>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div>© {year} NorthSky Flow OS</div>
        <div style={styles.footerLinks}>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </footer>
    </main>
  );
}