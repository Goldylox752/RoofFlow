"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
const TELEGRAM_BOT =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL ?? "#";

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
     STRIPE CHECKOUT (SINGLE SOURCE OF TRUTH)
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

      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error("Missing checkout URL");
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoadingPlan(null);
    }
  }, []);

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      <Background />
      <Navbar />

      <Hero goToCheckout={goToCheckout} loadingPlan={loadingPlan} />

      <Stats />

      <Analytics revenueData={revenueData} leadData={leadData} />

      <Features />

      <Pricing goToCheckout={goToCheckout} loadingPlan={loadingPlan} />

      <FinalCTA goToCheckout={goToCheckout} />

      <Footer />
    </main>
  );
}

/* ===============================
   BACKGROUND
=============================== */
function Background() {
  return (
    <div className="absolute inset-0 -z-50 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.25),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_35%)]" />
  );
}

/* ===============================
   NAVBAR (SIMPLIFIED)
=============================== */
function Navbar() {
  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="font-semibold">NorthSky</div>

        <div className="flex gap-4 text-sm text-zinc-400">
          <a href="/demo" className="hover:text-white">
            Demo
          </a>
          <a href={TELEGRAM_BOT} className="hover:text-white">
            Support
          </a>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   HERO (CLEAR MONEY FLOW)
=============================== */
function Hero({
  goToCheckout,
  loadingPlan,
}: {
  goToCheckout: (plan: string) => void;
  loadingPlan: string | null;
}) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-28 md:grid-cols-2">
      <div>
        <h1 className="text-6xl font-semibold leading-tight">
          Autonomous AI Revenue System
        </h1>

        <p className="mt-6 text-zinc-400">
          AI agents that find leads, qualify prospects, and drive conversions automatically.
        </p>

        <div className="mt-10 flex gap-4">
          <Button onClick={() => goToCheckout("growth")}>
            {loadingPlan === "growth" ? "Loading..." : "Start"}
          </Button>

          <a href="/demo" className="text-sm text-zinc-400 underline">
            View Demo
          </a>
        </div>
      </div>

      <Card className="border border-white/10 bg-white/5 p-6">
        <div className="space-y-2">
          <Metric title="Revenue" value="$48,220" />
          <Metric title="Leads" value="1,248" />
          <Metric title="Conversion" value="24.8%" />
        </div>
      </Card>
    </section>
  );
}

/* ===============================
   STATS
=============================== */
function Stats() {
  return (
    <div className="border-y border-white/10 bg-white/5">
      <div className="mx-auto grid max-w-7xl grid-cols-3 px-6 py-16 text-center">
        <div>
          <div className="text-3xl font-semibold">$1.2M+</div>
          <div className="text-sm text-zinc-400">Revenue</div>
        </div>

        <div>
          <div className="text-3xl font-semibold">12K+</div>
          <div className="text-sm text-zinc-400">Leads</div>
        </div>

        <div>
          <div className="text-3xl font-semibold">24/7</div>
          <div className="text-sm text-zinc-400">Automation</div>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   ANALYTICS (UNCHANGED LOGIC)
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
      <h2 className="text-4xl font-semibold">Live System Analytics</h2>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <ChartCard title="Revenue">
          <Chart type="area" dataKey="revenue" data={revenueData} />
        </ChartCard>

        <ChartCard title="Leads">
          <Chart type="bar" dataKey="leads" data={leadData} />
        </ChartCard>
      </div>
    </section>
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
    <Card className="border border-white/10 bg-white/5 p-6">
      <h3>{title}</h3>
      {children}
    </Card>
  );
}

/* ===============================
   FEATURES
=============================== */
function Features() {
  const items = [
    "AI Lead Engine",
    "Stripe Billing",
    "Automation Core",
    "Webhook System",
    "Analytics Layer",
    "CRM System",
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-28">
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((i) => (
          <Card key={i} className="border border-white/10 bg-white/5 p-6">
            {i}
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ===============================
   PRICING (SINGLE PATH)
=============================== */
function Pricing({
  goToCheckout,
  loadingPlan,
}: {
  goToCheckout: (plan: string) => void;
  loadingPlan: string | null;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28">
      <div className="grid gap-6 md:grid-cols-3">
        {["starter", "growth", "elite"].map((p) => (
          <Card key={p} className="border border-white/10 bg-white/5 p-6">
            <h3 className="capitalize">{p}</h3>

            <Button
              className="mt-6 w-full"
              onClick={() => goToCheckout(p)}
            >
              {loadingPlan === p ? "Redirecting..." : "Get Access"}
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ===============================
   FINAL CTA (ONLY CONVERSION POINT)
=============================== */
function FinalCTA({
  goToCheckout,
}: {
  goToCheckout: (plan: string) => void;
}) {
  return (
    <section className="py-28 text-center">
      <h2 className="text-5xl font-semibold">
        Launch your AI system today
      </h2>

      <Button className="mt-8" onClick={() => goToCheckout("growth")}>
        Start Now
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
      © {new Date().getFullYear()} NorthSky
    </footer>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-400">{title}</span>
      <span>{value}</span>
    </div>
  );
}

/* ===============================
   CHART (UNCHANGED)
=============================== */
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
    <div className="h-[240px] mt-4">
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
    </div>
  );
}