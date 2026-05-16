"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  BarChart,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/* ===============================
   CONFIG
=============================== */
const SUPPORT_LINK = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL ?? "#";

/* ===============================
   PAGE
=============================== */
export default function HomePage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const revenueData = useMemo(
    () => [
      { month: "Jan", revenue: 12000 },
      { month: "Feb", revenue: 18000 },
      { month: "Mar", revenue: 22000 },
      { month: "Apr", revenue: 31000 },
      { month: "May", revenue: 48220 },
    ],
    []
  );

  const leadData = useMemo(
    () => [
      { name: "Mon", leads: 120 },
      { name: "Tue", leads: 180 },
      { name: "Wed", leads: 240 },
      { name: "Thu", leads: 210 },
      { name: "Fri", leads: 320 },
    ],
    []
  );

  /* ===============================
     CHECKOUT
  =============================== */
  const goToCheckout = useCallback(async (plan: string) => {
    try {
      setLoadingPlan(plan);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoadingPlan(null);
    }
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <Hero onCheckout={goToCheckout} loadingPlan={loadingPlan} />

      <SocialProof />

      <ProductValue />

      <Analytics revenueData={revenueData} leadData={leadData} />

      <Pricing onCheckout={goToCheckout} loadingPlan={loadingPlan} />

      <FinalCTA onCheckout={goToCheckout} />

      <Footer />
    </main>
  );
}

/* ===============================
   NAVBAR
=============================== */
function Navbar() {
  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="font-semibold">NorthSky</div>

        <div className="flex gap-6 text-sm text-zinc-400">
          <a href="#pricing" className="hover:text-white">
            Pricing
          </a>
          <a href={SUPPORT_LINK} className="hover:text-white">
            Support
          </a>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   HERO (CLEAR VALUE PROP)
=============================== */
function Hero({
  onCheckout,
  loadingPlan,
}: {
  onCheckout: (plan: string) => void;
  loadingPlan: string | null;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28 grid md:grid-cols-2 gap-16">
      <div>
        <h1 className="text-6xl font-semibold leading-tight">
          AI system that converts leads into revenue automatically
        </h1>

        <p className="mt-6 text-zinc-400">
          Capture leads, score intent, and automate follow-ups using AI + Stripe billing + CRM workflows.
        </p>

        <div className="mt-10 flex gap-4">
          <Button onClick={() => onCheckout("growth")}>
            Start Free Trial
          </Button>

          <a href="#pricing" className="text-sm text-zinc-400 underline">
            View Pricing
          </a>
        </div>
      </div>

      <Card className="bg-white/5 border border-white/10 p-6">
        <div className="space-y-2">
          <Metric label="Monthly Revenue" value="$48,220" />
          <Metric label="Active Leads" value="1,248" />
          <Metric label="Conversion Rate" value="24.8%" />
        </div>
      </Card>
    </section>
  );
}

/* ===============================
   SOCIAL PROOF
=============================== */
function SocialProof() {
  return (
    <div className="border-y border-white/10 bg-white/5">
      <div className="mx-auto max-w-7xl px-6 py-14 grid grid-cols-3 text-center">
        <div>
          <div className="text-3xl font-semibold">$1.2M+</div>
          <div className="text-sm text-zinc-400">Revenue Generated</div>
        </div>

        <div>
          <div className="text-3xl font-semibold">12,000+</div>
          <div className="text-sm text-zinc-400">Leads Processed</div>
        </div>

        <div>
          <div className="text-3xl font-semibold">24/7</div>
          <div className="text-sm text-zinc-400">AI Automation</div>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   PRODUCT VALUE SECTION
=============================== */
function ProductValue() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28">
      <h2 className="text-4xl font-semibold">
        Replace manual sales workflows with AI automation
      </h2>

      <p className="mt-4 text-zinc-400">
        NorthSky continuously analyzes leads, prioritizes high-value prospects, and triggers automated conversion workflows.
      </p>
    </section>
  );
}

/* ===============================
   ANALYTICS
=============================== */
function Analytics({
  revenueData,
  leadData,
}: {
  revenueData: any[];
  leadData: any[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28">
      <h2 className="text-4xl font-semibold">Live Performance</h2>

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <ChartCard title="Revenue Growth">
          <Chart type="area" dataKey="revenue" data={revenueData} />
        </ChartCard>

        <ChartCard title="Lead Flow">
          <Chart type="bar" dataKey="leads" data={leadData} />
        </ChartCard>
      </div>

      <div className="mt-6">
        <Card className="bg-white/5 border border-white/10 p-6">
          <h3 className="text-sm text-zinc-400">AI Insight</h3>
          <p className="mt-2">
            Growth-tier users convert significantly higher. Recommend prioritizing upsell prompts at 48-hour usage mark.
          </p>
        </Card>
      </div>
    </section>
  );
}

/* ===============================
   PRICING
=============================== */
function Pricing({
  onCheckout,
  loadingPlan,
}: {
  onCheckout: (plan: string) => void;
  loadingPlan: string | null;
}) {
  const plans = [
    { id: "starter", highlight: false },
    { id: "growth", highlight: true },
    { id: "elite", highlight: false },
  ];

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-28">
      <h2 className="text-4xl font-semibold">Pricing</h2>

      <div className="mt-10 grid md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <Card
            key={p.id}
            className={`p-6 border ${
              p.highlight ? "border-indigo-500" : "border-white/10"
            } bg-white/5`}
          >
            <h3 className="capitalize text-xl">{p.id}</h3>

            <Button
              className="mt-6 w-full"
              onClick={() => onCheckout(p.id)}
            >
              {loadingPlan === p.id ? "Loading..." : "Get Started"}
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ===============================
   FINAL CTA
=============================== */
function FinalCTA({
  onCheckout,
}: {
  onCheckout: (plan: string) => void;
}) {
  return (
    <section className="py-28 text-center">
      <h2 className="text-5xl font-semibold">
        Start automating your revenue today
      </h2>

      <Button className="mt-8" onClick={() => onCheckout("growth")}>
        Launch Now
      </Button>
    </section>
  );
}

/* ===============================
   FOOTER
=============================== */
function Footer() {
  return (
    <footer className="border-t border-white/10 py-10 text-center text-sm text-zinc-500">
      © {new Date().getFullYear()} NorthSky. All rights reserved.
    </footer>
  );
}

/* ===============================
   UI HELPERS
=============================== */
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-white/5 border border-white/10 p-6">
      <h3>{title}</h3>
      <div className="h-[240px] mt-4">{children}</div>
    </Card>
  );
}

function Chart({
  type,
  dataKey,
  data,
}: {
  type: "area" | "bar";
  dataKey: string;
  data: any[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {type === "area" ? (
        <AreaChart data={data}>
          <CartesianGrid stroke="#222" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Area dataKey={dataKey} stroke="#6366f1" fill="#6366f1" />
        </AreaChart>
      ) : (
        <BarChart data={data}>
          <CartesianGrid stroke="#222" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey} fill="#6366f1" />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}