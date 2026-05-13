"use client";

import { useRouter } from "next/navigation";

export default function HomeClient() {
  const router = useRouter();

  const go = (plan: string) => {
    router.push(`/checkout?plan=${plan}`);
  };

  return (
    <main style={styles.page}>
      <Navbar />

      <Hero go={go} />

      <SocialProof />

      <ProblemSolution />

      <Features />

      <Pricing go={go} />

      <FinalCTA go={go} />

      <Footer />
    </main>
  );
}

/* ===============================
   NAVBAR
=============================== */
function Navbar() {
  return (
    <header style={styles.nav}>
      <div style={styles.logo}>SaaSKit</div>
      <div style={styles.navRight}>
        <a style={styles.navLink}>Features</a>
        <a style={styles.navLink}>Pricing</a>
        <a style={styles.navLink}>Docs</a>
      </div>
    </header>
  );
}

/* ===============================
   HERO
=============================== */
function Hero({ go }: any) {
  return (
    <section style={styles.hero}>
      <div style={styles.badge}>Production-ready SaaS starter kit</div>

      <h1 style={styles.title}>
        Launch your SaaS in days, not months
      </h1>

      <p style={styles.subtitle}>
        Auth, Stripe billing, subscriptions, feature gating, and scalable backend
        architecture—already built and production-ready.
      </p>

      <div style={styles.ctaRow}>
        <button style={styles.primary} onClick={() => go("starter")}>
          Start for $9/mo
        </button>
        <button style={styles.secondary} onClick={() => go("growth")}>
          View pricing
        </button>
      </div>

      <p style={styles.micro}>
        No setup. No boilerplate chaos. Ship immediately.
      </p>
    </section>
  );
}

/* ===============================
   SOCIAL PROOF
=============================== */
function SocialProof() {
  return (
    <section style={styles.trust}>
      Built with production-grade infrastructure used in real SaaS products
    </section>
  );
}

/* ===============================
   PROBLEM → SOLUTION
=============================== */
function ProblemSolution() {
  return (
    <section style={styles.section}>
      <h2>Stop rebuilding SaaS infrastructure from scratch</h2>

      <div style={styles.grid}>
        <div>
          <h3 style={styles.badTitle}>Before</h3>
          <ul>
            <li>Building auth systems manually</li>
            <li>Stripe integration headaches</li>
            <li>No subscription logic</li>
            <li>Broken scaling structure</li>
          </ul>
        </div>

        <div>
          <h3 style={styles.goodTitle}>After</h3>
          <ul>
            <li>Ready-to-use authentication</li>
            <li>Stripe billing fully integrated</li>
            <li>Plan-based feature control</li>
            <li>Scalable backend architecture</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ===============================
   FEATURES
=============================== */
function Features() {
  return (
    <section style={styles.section}>
      <h2>Everything you need, already built</h2>

      <div style={styles.featureGrid}>
        <Feature title="Authentication" desc="JWT + session management" />
        <Feature title="Billing" desc="Stripe subscriptions + webhooks" />
        <Feature title="Feature Control" desc="Plan-based access control" />
        <Feature title="Pricing Engine" desc="Dynamic pricing logic system" />
        <Feature title="Security" desc="Rate limiting + middleware" />
        <Feature title="Architecture" desc="Scalable Express backend" />
      </div>
    </section>
  );
}

function Feature({ title, desc }: any) {
  return (
    <div style={styles.featureCard}>
      <strong>{title}</strong>
      <p style={{ opacity: 0.7 }}>{desc}</p>
    </div>
  );
}

/* ===============================
   PRICING
=============================== */
function Pricing({ go }: any) {
  return (
    <section style={styles.section}>
      <h2>Simple pricing</h2>

      <div style={styles.pricing}>
        <Plan title="Starter" price="$9" onClick={() => go("starter")} />
        <Plan title="Growth" price="$29" onClick={() => go("growth")} />
        <Plan title="Elite" price="$79" onClick={() => go("elite")} />
      </div>
    </section>
  );
}

function Plan({ title, price, onClick }: any) {
  return (
    <div style={styles.card}>
      <h3>{title}</h3>
      <p style={styles.price}>{price}/mo</p>
      <button style={styles.primarySmall} onClick={onClick}>
        Get {title}
      </button>
    </div>
  );
}

/* ===============================
   FINAL CTA
=============================== */
function FinalCTA({ go }: any) {
  return (
    <section style={styles.final}>
      <h2>Ready to launch your SaaS?</h2>
      <button style={styles.primary} onClick={() => go("starter")}>
        Start now
      </button>
    </section>
  );
}

/* ===============================
   FOOTER
=============================== */
function Footer() {
  return (
    <footer style={styles.footer}>
      © {new Date().getFullYear()} SaaSKit. All rights reserved.
    </footer>
  );
}

/* ===============================
   STYLES (cleaned)
=============================== */
const styles: any = {
  page: {
    background: "#0b0f17",
    color: "#fff",
    fontFamily: "sans-serif",
  },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid #1a1f2e",
  },

  logo: {
    fontWeight: "bold",
  },

  navRight: {
    display: "flex",
    gap: 16,
  },

  navLink: {
    opacity: 0.7,
    cursor: "pointer",
  },

  hero: {
    padding: "100px 24px",
    textAlign: "center",
    maxWidth: 900,
    margin: "0 auto",
  },

  badge: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 16,
  },

  title: {
    fontSize: 48,
    fontWeight: 700,
    lineHeight: 1.1,
  },

  subtitle: {
    marginTop: 16,
    fontSize: 18,
    opacity: 0.75,
  },

  ctaRow: {
    marginTop: 28,
    display: "flex",
    justifyContent: "center",
    gap: 12,
  },

  primary: {
    padding: "12px 20px",
    background: "#4f46e5",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },

  primarySmall: {
    padding: "10px 16px",
    background: "#4f46e5",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },

  secondary: {
    padding: "12px 20px",
    background: "transparent",
    border: "1px solid #333",
    color: "#fff",
    cursor: "pointer",
  },

  micro: {
    marginTop: 12,
    fontSize: 12,
    opacity: 0.5,
  },

  trust: {
    textAlign: "center",
    padding: "30px 20px",
    opacity: 0.6,
    borderTop: "1px solid #1a1f2e",
    borderBottom: "1px solid #1a1f2e",
  },

  section: {
    padding: "80px 24px",
    maxWidth: 1000,
    margin: "0 auto",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 40,
    marginTop: 20,
  },

  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginTop: 20,
  },

  featureCard: {
    border: "1px solid #1f2937",
    padding: 16,
  },

  pricing: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginTop: 20,
  },

  card: {
    border: "1px solid #1f2937",
    padding: 20,
  },

  price: {
    fontSize: 28,
    margin: "10px 0",
  },

  final: {
    padding: "100px 24px",
    textAlign: "center",
  },

  footer: {
    padding: 40,
    textAlign: "center",
    opacity: 0.4,
    borderTop: "1px solid #1a1f2e",
  },

  badTitle: { color: "#f87171" },
  goodTitle: { color: "#34d399" },
};