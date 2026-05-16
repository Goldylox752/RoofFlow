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
      <ProofBar />
      <ValueSection />
      <Analytics revenueData={revenueData} leadData={leadData} />
      <Pricing onCheckout={goToCheckout} loadingPlan={loadingPlan} />
      <CTA onCheckout={goToCheckout} />
      <Footer />
    </main>
  );
}

/* ===============================
   NAVBAR
=============================== */
function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="font-semibold">NorthSky</div>

        <nav className="flex gap-6 text-sm text-zinc-400">
          <a href="#pricing" className="hover:text-white">
            Pricing
          </a>
          <a href={SUPPORT_LINK} className="hover:text-white">
            Support
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ===============================
   HERO
=============================== */
function Hero({
  onCheckout,
  loadingPlan,
}: {
  onCheckout: (plan: string) => void;
  loadingPlan: string | null;
}) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-28 md:grid-cols-2">
      <div>
        <h1 className="text-6xl font-semibold leading-tight">
          Automate lead conversion with AI-driven workflows
        </h1>

        <p className="mt-6 text-zinc-400">
          Capture, qualify, and convert leads using automated AI decisions,
          Stripe billing, and CRM workflow automation.
        </p>

        <div className="mt-10 flex gap-4">
          <Button onClick={() => onCheckout("growth")}>
            Start Trial
          </Button>

          <a href="#pricing" className="text-sm text-zinc-400 underline">
            View Pricing
          </a>
        </div>
      </div>

      <Card className="border border-white/10 bg-white/5 p-6">
        <Metric label="MRR" value="$48,220" />
        <Metric label="Active Leads" value="1,248" />
        <Metric label="Conversion Rate" value="24.8%" />
      </Card>
    </section>
  );
}

/* ===============================
   PROOF BAR
=============================== */
function ProofBar() {
  return (
    <section className="border-y border-white/10 bg-white/5">
      <div className="mx-auto grid max-w-7xl grid-cols-3 px-6 py-14 text-center">
        <Stat label="Revenue Generated" value="$1.2M+" />
        <Stat label="Leads Processed" value="12,000+" />
        <Stat label="Automation Uptime" value="24/7" />
      </div>
    </section>
  );
}

/* ===============================
   VALUE SECTION
=============================== */
function ValueSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28">
      <h2 className="text-4xl font-semibold">
        Replace manual sales workflows with automated AI systems
      </h2>

      <p className="mt-4 text-zinc-400">
        NorthSky continuously analyzes leads, prioritizes high-value prospects,
        and triggers conversion workflows automatically.
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
      <h2 className="text-4xl font-semibold">Performance Overview</h2>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <ChartCard title="Revenue Growth">
          <Chart type="area" dataKey="revenue" data={revenueData} />
        </ChartCard>

        <ChartCard title="Lead Flow">
          <Chart type="bar" dataKey="leads" data={leadData} />
        </ChartCard>
      </div>

      <Card className="mt-6 border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm text-zinc-400">System Insight</h3>
        <p className="mt-2 text-sm">
          Growth-tier users show higher conversion rates. Recommendation:
          optimize upsell timing within 48 hours of activation.
        </p>
      </Card>
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
  const plans = ["starter", "growth", "elite"];

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-28">
      <h2 className="text-4xl font-semibold">Pricing</h2>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan}
            className="border border-white/10 bg-white/5 p-6"
          >
            <h3 className="capitalize text-xl">{plan}</h3>

            <Button
              className="mt-6 w-full"
              onClick={() => onCheckout(plan)}
            >
              {loadingPlan === plan ? "Loading..." : "Get Started"}
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ===============================
   CTA
=============================== */
function CTA({
  onCheckout,
}: {
  onCheckout: (plan: string) => void;
}) {
  return (
    <section className="py-28 text-center">
      <h2 className="text-5xl font-semibold">
        Start automating revenue today
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
   UI COMPONENTS
=============================== */
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-zinc-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-3xl font-semibold">{value}</div>
      <div className="text-sm text-zinc-400">{label}</div>
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
    <Card className="border border-white/10 bg-white/5 p-6">
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