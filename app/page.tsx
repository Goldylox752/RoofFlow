"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export default function Home() {
  const [status, setStatus] = useState<any>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  /* =========================
     SAFETY CHECK
  ========================= */
  if (!API) {
    throw new Error("❌ Missing NEXT_PUBLIC_API_URL");
  }

  /* =========================
     HEALTH CHECK
  ========================= */
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API}/health`);
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        setStatus({
          success: false,
          message: "Backend offline",
        });
      }
    };

    checkHealth();
  }, []);

  /* =========================
     STRIPE CHECKOUT (AUTH READY)
     NOTE: backend should use req.user (JWT)
  ========================= */
  const startCheckout = async () => {
    try {
      setLoadingCheckout(true);

      const res = await fetch(`${API}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          // 🔐 future-proof auth header (Supabase JWT)
          // Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: "starter",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Checkout failed");
      }

      if (!data?.url) {
        throw new Error("Missing checkout URL");
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert(err.message || "Checkout failed");
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <main style={styles.page}>
      {/* NAV */}
      <header style={styles.nav}>
        <div style={styles.logo}>Flow OS</div>

        <div style={styles.navRight}>
          <a style={styles.link} href="#features">
            Features
          </a>

          <a style={styles.link} href="#status">
            Status
          </a>

          <button style={styles.buttonSmall} onClick={startCheckout}>
            {loadingCheckout ? "Loading..." : "Start Free Trial"}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section style={styles.hero}>
        <h1 style={styles.title}>
          The AI Backend Infrastructure for Modern Apps
        </h1>

        <p style={styles.subtitle}>
          Build faster with scalable APIs, authentication,
          Stripe billing, and real-time backend monitoring.
        </p>

        <div style={styles.ctaRow}>
          <button style={styles.primaryButton} onClick={startCheckout}>
            {loadingCheckout ? "Redirecting..." : "Launch Platform"}
          </button>

          <a style={styles.secondaryButton} href="#features">
            Explore Features
          </a>
        </div>
      </section>

      {/* STATUS */}
      <section id="status" style={styles.statusSection}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>System Status</h2>

          {!status ? (
            <p style={styles.muted}>Checking backend...</p>
          ) : status.success ? (
            <>
              <p style={styles.successText}>✅ {status.message}</p>
              <p style={styles.muted}>Status: {status.status}</p>
            </>
          ) : (
            <>
              <p style={styles.errorText}>❌ {status.message}</p>
              <p style={styles.muted}>Check backend deployment</p>
            </>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={styles.features}>
        <div style={styles.featureCard}>
          <h3>⚡ Fast API Layer</h3>
          <p>Scalable Node.js + Express backend architecture.</p>
        </div>

        <div style={styles.featureCard}>
          <h3>🔐 Secure Infrastructure</h3>
          <p>Auth + Stripe billing + protected APIs.</p>
        </div>

        <div style={styles.featureCard}>
          <h3>📡 Live System Health</h3>
          <p>Real-time monitoring and API observability.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p>Flow OS • AI Infrastructure Platform</p>
      </footer>
    </main>
  );
}