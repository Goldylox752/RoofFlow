"use client";

import { useEffect, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [status, setStatus] = useState<any>(null);
  const [loadingCheckout, setLoadingCheckout] =
    useState(false);

  /* =========================
     HEALTH CHECK
  ========================= */
  useEffect(() => {
    if (!API) {
      setStatus({
        success: false,
        message:
          "Missing NEXT_PUBLIC_API_URL",
      });
      return;
    }

    fetch(`${API}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() =>
        setStatus({
          success: false,
          message: "Backend offline",
        })
      );
  }, []);

  /* =========================
     STRIPE CHECKOUT
  ========================= */
  const startCheckout = async () => {
    try {
      setLoadingCheckout(true);

      const res = await fetch(
        `${API}/api/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            plan: "pro",
          }),
        }
      );

      const data = await res.json();

      if (!data?.url) {
        throw new Error(
          data?.error ||
            "Failed to create checkout session"
        );
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);

      alert(
        err.message ||
          "Checkout failed"
      );
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <main style={styles.page}>
      
      {/* NAVBAR */}
      <header style={styles.nav}>
        <div style={styles.logo}>
          Flow OS
        </div>

        <div style={styles.navRight}>
          <a
            style={styles.link}
            href="#features"
          >
            Features
          </a>

          <a
            style={styles.link}
            href="#status"
          >
            Status
          </a>

          <button
            style={styles.buttonSmall}
            onClick={startCheckout}
          >
            {loadingCheckout
              ? "Loading..."
              : "Start Free Trial"}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section style={styles.hero}>
        <h1 style={styles.title}>
          The AI Backend Infrastructure
          for Modern Apps
        </h1>

        <p style={styles.subtitle}>
          Build faster with scalable APIs,
          authentication, Stripe billing,
          and real-time backend monitoring.
        </p>

        <div style={styles.ctaRow}>
          <button
            style={styles.primaryButton}
            onClick={startCheckout}
          >
            {loadingCheckout
              ? "Redirecting..."
              : "Launch Platform"}
          </button>

          <a
            style={styles.secondaryButton}
            href="#features"
          >
            Explore Features
          </a>
        </div>
      </section>

      {/* STATUS */}
      <section
        id="status"
        style={styles.statusSection}
      >
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            System Status
          </h2>

          {!status ? (
            <p style={styles.muted}>
              Checking backend...
            </p>
          ) : status.success ? (
            <>
              <p style={styles.successText}>
                ✅ {status.message}
              </p>

              <p style={styles.muted}>
                Status: {status.status}
              </p>
            </>
          ) : (
            <>
              <p style={styles.errorText}>
                ❌ {status.message}
              </p>

              <p style={styles.muted}>
                Check Render deployment
              </p>
            </>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        style={styles.features}
      >
        <div style={styles.featureCard}>
          <h3>
            ⚡ Fast API Layer
          </h3>

          <p>
            Scalable Node.js +
            Express backend
            architecture deployed
            on Render.
          </p>
        </div>

        <div style={styles.featureCard}>
          <h3>
            🔐 Secure Infrastructure
          </h3>

          <p>
            Production-ready auth,
            Stripe billing, and
            environment-based config.
          </p>
        </div>

        <div style={styles.featureCard}>
          <h3>
            📡 Live System Health
          </h3>

          <p>
            Monitor backend uptime
            and API performance in
            real-time.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p>
          Flow OS • AI Infrastructure
          Platform
        </p>
      </footer>
    </main>
  );
}

/* =========================
   STYLES
========================= */

const styles: any = {
  page: {
    fontFamily:
      "Arial, sans-serif",
    background:
      "linear-gradient(to bottom, #0b0f17, #111827)",
    color: "#fff",
    minHeight: "100vh",
  },

  nav: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    padding: "20px 40px",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
  },

  logo: {
    fontWeight: "bold",
    fontSize: 20,
    letterSpacing: 1,
  },

  navRight: {
    display: "flex",
    gap: 20,
    alignItems: "center",
  },

  link: {
    color: "#aaa",
    textDecoration: "none",
  },

  buttonSmall: {
    padding: "10px 16px",
    background: "#2563eb",
    borderRadius: 8,
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },

  hero: {
    textAlign: "center",
    padding:
      "120px 20px 80px",
  },

  title: {
    fontSize: 52,
    fontWeight: 800,
    maxWidth: 900,
    margin: "0 auto",
    lineHeight: 1.1,
  },

  subtitle: {
    marginTop: 24,
    fontSize: 20,
    color: "#aaa",
    maxWidth: 700,
    marginLeft: "auto",
    marginRight: "auto",
    lineHeight: 1.6,
  },

  ctaRow: {
    marginTop: 40,
    display: "flex",
    gap: 16,
    justifyContent: "center",
    flexWrap: "wrap",
  },

  primaryButton: {
    background: "#2563eb",
    padding:
      "14px 24px",
    borderRadius: 10,
    color: "#fff",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
  },

  secondaryButton: {
    border:
      "1px solid rgba(255,255,255,0.15)",
    padding:
      "14px 24px",
    borderRadius: 10,
    color: "#fff",
    textDecoration: "none",
  },

  statusSection: {
    display: "flex",
    justifyContent:
      "center",
    padding:
      "40px 20px 80px",
  },

  card: {
    background:
      "rgba(17,24,39,0.8)",
    padding: 30,
    borderRadius: 16,
    width: "100%",
    maxWidth: 520,
    textAlign: "center",
    border:
      "1px solid rgba(255,255,255,0.08)",
    backdropFilter:
      "blur(10px)",
  },

  cardTitle: {
    marginBottom: 16,
    fontSize: 24,
  },

  successText: {
    color: "#22c55e",
    fontSize: 18,
  },

  errorText: {
    color: "#ef4444",
    fontSize: 18,
  },

  muted: {
    color: "#9ca3af",
    marginTop: 10,
  },

  features: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    padding:
      "0 40px 80px",
  },

  featureCard: {
    background:
      "rgba(17,24,39,0.8)",
    padding: 24,
    borderRadius: 16,
    border:
      "1px solid rgba(255,255,255,0.08)",
  },

  footer: {
    textAlign: "center",
    padding: 40,
    color: "#666",
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
  },
};