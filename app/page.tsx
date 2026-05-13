"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useForm } from "@formspree/react";

const FORM_ID = "xkoyyaej";

const plans = [
  { id: "starter", name: "Starter", price: "$9/mo", cta: "Start Starter" },
  { id: "growth", name: "Growth", price: "$29/mo", cta: "Choose Growth", featured: true },
  { id: "elite", name: "Elite", price: "$79/mo", cta: "Go Elite" },
];

export default function HomeClient() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const year = useMemo(() => new Date().getFullYear(), []);

  const [waitlistState, handleWaitlistSubmit] = useForm(FORM_ID);
  const [contactState, handleContactSubmit] = useForm(FORM_ID);
  const isLoading = Boolean(loadingPlan);

  const trackEvent = async (event: string, data?: any) => {
    try {
      await fetch(`https://formspree.io/f/${FORM_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, data }),
      });
    } catch {}
  };

  const checkout = async (planId: string) => {
    if (loadingPlan) return;
    setError("");
    setLoadingPlan(planId);

    try {
      await trackEvent("checkout_click", { planId });
      const res = await api("/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      if (!res?.url) throw new Error("Missing checkout URL from server");
      window.location.href = res.url;
    } catch (err: any) {
      setError(err?.message || "Checkout failed – please try again later.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      {/* Structured Data (JSON‑LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Launch SaaS faster boilerplate",
            description: "Production‑ready Next.js SaaS starter with authentication, payments, and waitlist.",
            brand: { "@type": "Brand", name: "LaunchFast" },
            offers: plans.map(p => ({
              "@type": "Offer",
              name: p.name,
              price: p.price.replace("$", ""),
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
            })),
          }),
        }}
      />

      <main style={styles.main}>
        {/* Hero */}
        <section style={styles.hero}>
          <h1 style={styles.h1}>Launch SaaS faster</h1>
          <p style={styles.subhead}>From idea to revenue in days. Used by 200+ founders.</p>
          <button
            style={styles.primaryBtn}
            onClick={() => checkout("starter")}
            disabled={isLoading}
            aria-label="Start building with Starter plan"
          >
            {loadingPlan === "starter" ? "Processing..." : "Start Building"}
          </button>
        </section>

        {/* Pricing */}
        <section style={styles.section} aria-labelledby="pricing-heading">
          <h2 id="pricing-heading" style={styles.h2}>Simple, transparent pricing</h2>
          <div style={styles.cardContainer}>
            {plans.map((p) => (
              <div
                key={p.id}
                style={{
                  ...styles.card,
                  ...(p.featured ? styles.featuredCard : {}),
                }}
              >
                <h3 style={styles.planName}>{p.name}</h3>
                <p style={styles.price}>{p.price}</p>
                <button
                  onClick={() => checkout(p.id)}
                  style={p.featured ? styles.primaryBtn : styles.btn}
                  disabled={isLoading}
                  aria-label={`Choose ${p.name} plan for ${p.price}`}
                >
                  {loadingPlan === p.id ? "Processing..." : p.cta}
                </button>
              </div>
            ))}
          </div>
          {error && <p style={styles.errorMsg} role="alert">{error}</p>
        </section>

        {/* Waitlist */}
        <section style={styles.section} aria-labelledby="waitlist-heading">
          <h2 id="waitlist-heading" style={styles.h2}>Get early access</h2>
          {waitlistState.succeeded ? (
            <p style={styles.successMsg}>✅ You’re on the list! We’ll notify you.</p>
          ) : (
            <form onSubmit={handleWaitlistSubmit} style={styles.form}>
              <label htmlFor="waitlist-email" style={styles.srOnly}>Email address</label>
              <input
                id="waitlist-email"
                name="email"
                type="email"
                placeholder="Email address"
                required
                style={styles.input}
              />
              <button type="submit" style={styles.primaryBtn}>
                Join Waitlist
              </button>
            </form>
          )}
        </section>

        {/* Contact */}
        <section style={styles.section} aria-labelledby="contact-heading">
          <h2 id="contact-heading" style={styles.h2}>Questions? Talk to us</h2>
          {contactState.succeeded ? (
            <p style={styles.successMsg}>✅ Message sent – we’ll reply within 24h.</p>
          ) : (
            <form onSubmit={handleContactSubmit} style={styles.form}>
              <label htmlFor="contact-email" style={styles.srOnly}>Your email</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                placeholder="Your email"
                required
                style={styles.input}
              />
              <label htmlFor="contact-message" style={styles.srOnly}>Message</label>
              <textarea
                id="contact-message"
                name="message"
                placeholder="What would you like to know?"
                rows={3}
                required
                style={styles.textarea}
              />
              <button type="submit" style={styles.primaryBtn}>
                Send Message
              </button>
            </form>
          )}
        </section>

        {/* Footer */}
        <footer style={styles.footer}>
          <p>© {year} LaunchFast. All rights reserved.</p>
          <p style={styles.footerLinks}>
            <a href="/privacy" style={styles.link}>Privacy</a> •{" "}
            <a href="/terms" style={styles.link}>Terms</a> •{" "}
            <span>📧 support@launchfast.com</span>
          </p>
          <p style={styles.small}>✅ Used by 200+ SaaS founders • 30‑day money‑back guarantee</p>
        </footer>
      </main>
    </>
  );
}

// ––––––––––––––––––––––––––––––––––––––––––––––––
// Styles – upgraded with responsive breakpoints
// ––––––––––––––––––––––––––––––––––––––––––––––––
const styles: { [key: string]: React.CSSProperties } = {
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem 1.5rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  hero: {
    textAlign: "center",
    padding: "4rem 1rem",
  },
  h1: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  subhead: {
    fontSize: "1.25rem",
    color: "#4b5563",
    marginBottom: "2rem",
  },
  section: {
    margin: "4rem 0",
    textAlign: "center",
  },
  h2: {
    fontSize: "2rem",
    marginBottom: "2rem",
  },
  cardContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "2rem",
  },
  card: {
    background: "#f9fafb",
    borderRadius: "1rem",
    padding: "2rem",
    width: "280px",
    textAlign: "center",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  featuredCard: {
    background: "#ffffff",
    border: "2px solid #3b82f6",
    transform: "scale(1.02)",
  },
  planName: {
    fontSize: "1.5rem",
    marginBottom: "0.5rem",
  },
  price: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: "1.5rem",
  },
  primaryBtn: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  btn: {
    background: "#e5e7eb",
    color: "#1f2937",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    cursor: "pointer",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    maxWidth: "400px",
    margin: "0 auto",
  },
  input: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #d1d5db",
    fontSize: "1rem",
  },
  textarea: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #d1d5db",
    fontSize: "1rem",
    fontFamily: "inherit",
  },
  errorMsg: {
    color: "#dc2626",
    marginTop: "1rem",
  },
  successMsg: {
    color: "#10b981",
    fontSize: "1rem",
  },
  footer: {
    marginTop: "5rem",
    textAlign: "center",
    paddingTop: "2rem",
    borderTop: "1px solid #e5e7eb",
    color: "#6b7280",
  },
  footerLinks: {
    margin: "0.5rem 0",
    fontSize: "0.875rem",
  },
  link: {
    color: "#3b82f6",
    textDecoration: "none",
    margin: "0 0.25rem",
  },
  small: {
    fontSize: "0.75rem",
  },
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
};