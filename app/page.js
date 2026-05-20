"use client";

import { useEffect, useState } from "react";

/* ───────────────────────────────
   DATA
─────────────────────────────── */
const FEED_ITEMS = [
  { city: "Austin, TX", type: "Storm Damage", score: 96, urgency: "CRITICAL", icon: "⚡" },
  { city: "Denver, CO", type: "Full Replacement", score: 89, urgency: "HIGH", icon: "🏠" },
  { city: "Calgary, AB", type: "Insurance Claim", score: 92, urgency: "CRITICAL", icon: "📋" },
  { city: "Phoenix, AZ", type: "Emergency Repair", score: 84, urgency: "HIGH", icon: "🔧" },
];

const FEATURES = [
  { title: "Storm Intelligence", stat: "8min avg alert" },
  { title: "AI Lead Scoring", stat: "94% accuracy" },
  { title: "Territory Control", stat: "3–50 markets" },
  { title: "Instant CRM Push", stat: "< 30s sync" },
];

const PLANS = [
  { name: "Starter", price: "297", priceId: "price_starter" },
  { name: "Pro", price: "697", priceId: "price_pro", featured: true },
  { name: "Enterprise", price: null, priceId: null },
];

/* ───────────────────────────────
   HOOKS
─────────────────────────────── */
function useLiveFeed() {
  const [items, setItems] = useState(FEED_ITEMS.slice(0, 3));

  useEffect(() => {
    const i = setInterval(() => {
      setItems((prev) => {
        const next = FEED_ITEMS[Math.floor(Math.random() * FEED_ITEMS.length)];
        return [next, ...prev].slice(0, 3);
      });
    }, 2500);

    return () => clearInterval(i);
  }, []);

  return items;
}

/* ───────────────────────────────
   COMPONENTS
─────────────────────────────── */
function LiveFeed() {
  const items = useLiveFeed();

  return (
    <div style={styles.feed}>
      <h3 style={styles.feedTitle}>LIVE DEMAND</h3>

      {items.map((i, idx) => (
        <div key={idx} style={styles.feedItem}>
          <span>{i.icon}</span>
          <div style={{ flex: 1 }}>
            <div>{i.type}</div>
            <small>{i.city}</small>
          </div>
          <strong>{i.score}</strong>
        </div>
      ))}
    </div>
  );
}

function Pricing({ onSelect }) {
  return (
    <div style={styles.grid3}>
      {PLANS.map((p) => (
        <div key={p.name} style={styles.card}>
          <h3>{p.name}</h3>
          <p style={{ fontSize: 28 }}>
            {p.price ? `$${p.price}` : "Custom"}
          </p>

          <button
            onClick={() => onSelect(p.priceId)}
            style={styles.button}
          >
            {p.priceId ? "Start" : "Contact"}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────────
   PAGE
─────────────────────────────── */
export default function Page() {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      body: JSON.stringify({ event: "page_view" }),
    }).catch(() => {});
  }, []);

  const startCheckout = async (priceId) => {
    if (!priceId) return setModalOpen(true);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });

    const data = await res.json();
    if (data?.url) window.location.href = data.url;
  };

  return (
    <div style={styles.page}>
      {/* HERO */}
      <section style={styles.hero}>
        <h1>Roofing Leads That Close</h1>
        <p>Real-time storm intelligence + AI scoring</p>

        <div style={styles.row}>
          <button onClick={() => setModalOpen(true)} style={styles.button}>
            Get Demo
          </button>
        </div>
      </section>

      {/* LIVE FEED */}
      <section style={styles.section}>
        <LiveFeed />
      </section>

      {/* FEATURES */}
      <section style={styles.section}>
        <h2>Features</h2>
        <div style={styles.grid2}>
          {FEATURES.map((f) => (
            <div key={f.title} style={styles.card}>
              <h3>{f.title}</h3>
              <small>{f.stat}</small>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={styles.section}>
        <h2>Pricing</h2>
        <Pricing onSelect={startCheckout} />
      </section>
    </div>
  );
}

/* ───────────────────────────────
   STYLES (CLEANED)
─────────────────────────────── */
const styles = {
  page: {
    background: "#020d02",
    color: "#c8e8c8",
    minHeight: "100vh",
    padding: 40,
    fontFamily: "system-ui",
  },

  hero: {
    padding: "80px 0",
    textAlign: "center",
  },

  section: {
    marginTop: 80,
  },

  row: {
    marginTop: 20,
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
  },

  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },

  card: {
    background: "#071007",
    border: "1px solid #1a3a1a",
    padding: 20,
    borderRadius: 12,
  },

  feed: {
    background: "#071007",
    padding: 20,
    borderRadius: 12,
  },

  feedTitle: {
    marginBottom: 12,
    fontSize: 12,
    opacity: 0.7,
  },

  feedItem: {
    display: "flex",
    gap: 12,
    padding: 10,
    borderBottom: "1px solid #1a3a1a",
  },

  button: {
    padding: "12px 18px",
    background: "#22c55e",
    border: 0,
    cursor: "pointer",
    fontWeight: 700,
  },
};