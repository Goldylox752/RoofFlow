"use client";

import { useState } from "react";

export default function HomePage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function go(plan: string) {
    setLoading(plan);

    const res = await fetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();

    if (data?.url) {
      window.location.href = data.url;
    }

    setLoading(null);
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-20">
      
      {/* HERO */}
      <section className="max-w-4xl mx-auto text-center">
        
        <h1 className="text-5xl font-semibold leading-tight">
          Know which leads will close{" "}
          <span className="text-indigo-400">
            before you waste time on them
          </span>
        </h1>

        <p className="mt-6 text-white/70 text-lg">
          AI analyzes your leads, predicts revenue, and shows you exactly where to focus next.
        </p>

        <div className="mt-10 flex gap-4 justify-center">
          <button
            onClick={() => go("growth")}
            className="px-6 py-3 bg-indigo-500 rounded-lg font-medium"
          >
            Start Free Trial
          </button>

          <a
            href="#pricing"
            className="px-6 py-3 border border-white/20 rounded-lg"
          >
            View Pricing
          </a>
        </div>

        <p className="text-xs text-white/40 mt-4">
          No credit card required to explore
        </p>
      </section>

      {/* PROBLEM SECTION */}
      <section className="max-w-4xl mx-auto mt-28">
        <h2 className="text-2xl font-semibold text-center">
          Most businesses waste time on the wrong leads
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mt-10 text-white/70">
          <div className="border border-white/10 p-4 rounded">
            ❌ No idea which leads will close
          </div>

          <div className="border border-white/10 p-4 rounded">
            ❌ Too much time wasted on low-quality prospects
          </div>

          <div className="border border-white/10 p-4 rounded">
            ❌ No clear revenue forecasting
          </div>
        </div>
      </section>

      {/* VALUE SECTION */}
      <section className="max-w-4xl mx-auto mt-28">
        <h2 className="text-2xl font-semibold text-center">
          AI tells you exactly what to do next
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          <div className="border border-white/10 p-4 rounded">
            📊 Lead scoring based on conversion likelihood
          </div>

          <div className="border border-white/10 p-4 rounded">
            💰 Revenue forecasting for next 30 days
          </div>

          <div className="border border-white/10 p-4 rounded">
            ⚡ Priority dashboard (what to focus on NOW)
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-5xl mx-auto mt-28 text-center">
        <h2 className="text-3xl font-semibold">
          Simple pricing that grows with you
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          
          <div className="border border-white/10 p-6 rounded">
            <h3 className="text-xl font-semibold">Starter</h3>
            <p className="text-white/60 mt-2">$29 / month</p>

            <button
              onClick={() => go("starter")}
              className="mt-6 w-full py-2 border border-white/20 rounded"
            >
              {loading === "starter" ? "Loading..." : "Start"}
            </button>
          </div>

          <div className="border border-indigo-500 p-6 rounded bg-indigo-500/10">
            <h3 className="text-xl font-semibold">Growth</h3>
            <p className="text-white/60 mt-2">$79 / month</p>

            <button
              onClick={() => go("growth")}
              className="mt-6 w-full py-2 bg-indigo-500 rounded"
            >
              {loading === "growth" ? "Loading..." : "Most Popular"}
            </button>
          </div>

          <div className="border border-white/10 p-6 rounded">
            <h3 className="text-xl font-semibold">Pro</h3>
            <p className="text-white/60 mt-2">$149 / month</p>

            <button
              onClick={() => go("pro")}
              className="mt-6 w-full py-2 border border-white/20 rounded"
            >
              {loading === "pro" ? "Loading..." : "Upgrade"}
            </button>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="text-center mt-28">
        <h2 className="text-4xl font-semibold">
          Stop guessing. Start closing better deals.
        </h2>

        <button
          onClick={() => go("growth")}
          className="mt-8 px-8 py-4 bg-indigo-500 rounded-lg"
        >
          Get Started
        </button>
      </section>

      {/* FOOTER */}
      <footer className="text-center text-white/40 mt-28 text-sm">
        © {new Date().getFullYear()} AI Revenue System
      </footer>
    </main>
  );
}