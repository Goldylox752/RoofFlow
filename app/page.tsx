"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function Home() {
  const [loading, setLoading] = useState(false);

  const checkout = async (plan: string) => {
    setLoading(true);

    try {
      const data = await api("/api/payments/checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });

      if (!data?.url) {
        alert("Checkout failed. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      alert("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <main
      style={{
        background: "#0b0f17",
        color: "#fff",
        minHeight: "100vh",
        padding: "60px 20px",
        fontFamily: "system-ui",
      }}
    >
      {/* HERO */}
      <section style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: 56, marginBottom: 12 }}>
          Flow OS
        </h1>

        <p style={{ fontSize: 22, opacity: 0.95, maxWidth: 750, margin: "0 auto" }}>
          Launch, automate, and monetize your business in minutes.
        </p>

        <p style={{ marginTop: 18, fontSize: 16, opacity: 0.7, maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
          Flow OS gives you workflows, payments, and backend automation — without infrastructure complexity.
          Build real SaaS systems without writing backend code.
        </p>

        <p style={{ marginTop: 16, fontSize: 14, opacity: 0.6 }}>
          Built for founders, developers, and startups who want to ship faster and scale without backend overhead.
        </p>

        {/* CTA */}
        <div style={{ marginTop: 30, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            style={primaryBtn}
            onClick={() => checkout("starter")}
          >
            Start building free
          </button>

          <button
            style={secondaryBtn}
            onClick={() => window.scrollTo({ top: 900, behavior: "smooth" })}
          >
            View pricing
          </button>
        </div>

        <p style={{ marginTop: 18, fontSize: 13, opacity: 0.6 }}>
          Stripe-powered • Secure by default • Cancel anytime
        </p>
      </section>

      {/* FEATURES */}
      <section
        style={{
          maxWidth: 1000,
          margin: "80px auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
        }}
      >
        <div style={card}>
          ⚡ Instant Setup
          <p style={sub}>
            Go from idea to live system in minutes — no backend setup required.
          </p>
        </div>

        <div style={card}>
          🤖 Automation Engine
          <p style={sub}>
            Build workflows that handle leads, actions, and business logic automatically.
          </p>
        </div>

        <div style={card}>
          💳 Stripe Ready
          <p style={sub}>
            Accept payments and subscriptions instantly with built-in Stripe integration.
          </p>
        </div>

        <div style={card}>
          🔐 Production Ready
          <p style={sub}>
            Secure, scalable architecture built for real SaaS products.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <h2>How it works</h2>

        <div style={{ marginTop: 40, display: "grid", gap: 20 }}>
          <div style={card}>
            <h3>1. Create your system</h3>
            <p style={sub}>Sign up and choose a workflow template.</p>
          </div>

          <div style={card}>
            <h3>2. Connect Stripe & logic</h3>
            <p style={sub}>Enable payments, triggers, and automation rules.</p>
          </div>

          <div style={card}>
            <h3>3. Launch & scale</h3>
            <p style={sub}>Your system runs automatically and handles users & revenue.</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ maxWidth: 1100, margin: "100px auto", textAlign: "center" }}>
        <h2 style={{ fontSize: 34 }}>
          Simple pricing that scales with your growth
        </h2>

        <p style={{ opacity: 0.7, marginTop: 10 }}>
          Start small, validate your idea, and upgrade anytime.
        </p>

        <div
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            marginTop: 40,
            flexWrap: "wrap",
          }}
        >
          {/* STARTER */}
          <div style={card}>
            <h3>Starter</h3>
            <p style={{ fontSize: 22 }}>$9/mo</p>

            <p style={sub}>Perfect for building your first automation system.</p>

            <ul style={list}>
              <li>Core workflow builder</li>
              <li>Stripe checkout integration</li>
              <li>Basic automation tools</li>
            </ul>

            <button style={btn} onClick={() => checkout("starter")} disabled={loading}>
              Start Starter
            </button>
          </div>

          {/* GROWTH */}
          <div style={{ ...card, border: "2px solid #4f7cff", transform: "scale(1.04)" }}>
            <h3>Growth ⭐</h3>
            <p style={{ fontSize: 22 }}>$29/mo</p>

            <p style={sub}>Best for launching real products and getting paying users.</p>

            <ul style={list}>
              <li>Advanced workflows</li>
              <li>Scalable automation engine</li>
              <li>Production-ready setup</li>
              <li>Priority performance</li>
            </ul>

            <button style={btn} onClick={() => checkout("growth")} disabled={loading}>
              Upgrade to Growth
            </button>
          </div>

          {/* ELITE */}
          <div style={card}>
            <h3>Elite</h3>
            <p style={{ fontSize: 22 }}>$79/mo</p>

            <p style={sub}>For agencies and high-scale production systems.</p>

            <ul style={list}>
              <li>Full automation suite</li>
              <li>Advanced integrations</li>
              <li>Premium support</li>
              <li>High-scale architecture</li>
            </ul>

            <button style={btn} onClick={() => checkout("elite")} disabled={loading}>
              Go Elite
            </button>
          </div>
        </div>
      </section>

      {/* LOADING */}
      {loading && (
        <p style={{ textAlign: "center", marginTop: 40, opacity: 0.7 }}>
          Redirecting to secure checkout...
        </p>
      )}

      {/* FOOTER */}
      <footer style={{ textAlign: "center", marginTop: 100, opacity: 0.6 }}>
        Flow OS — Build systems. Automate growth. Launch faster.
        <br />
        Secure payments powered by Stripe. Cancel anytime.
      </footer>
    </main>
  );
}

/* STYLES */

const card = {
  background: "#141a2a",
  padding: 24,
  borderRadius: 14,
  textAlign: "center",
  width: 260,
};

const sub = {
  fontSize: 14,
  opacity: 0.75,
  marginTop: 10,
};

const list = {
  textAlign: "left",
  marginTop: 15,
  fontSize: 14,
  opacity: 0.8,
};

const primaryBtn = {
  background: "#4f7cff",
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: 10,
  cursor: "pointer",
};

const secondaryBtn = {
  background: "transparent",
  color: "#fff",
  border: "1px solid #2a2f3a",
  padding: "12px 18px",
  borderRadius: 10,
  cursor: "pointer",
};

const btn = {
  marginTop: 15,
  background: "#4f7cff",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  width: "100%",
};