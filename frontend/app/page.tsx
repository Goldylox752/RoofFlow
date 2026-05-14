"use client";

import { useRouter } from "next/navigation";
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
const TELEGRAM_BOT = "https://t.me/YOUR_BOT_USERNAME";

/* ===============================
   DATA
=============================== */
const revenueData = [
  { month: "Jan", revenue: 12000 },
  { month: "Feb", revenue: 18000 },
  { month: "Mar", revenue: 22000 },
  { month: "Apr", revenue: 31000 },
  { month: "May", revenue: 48220 },
];

const leadData = [
  { name: "Mon", leads: 120 },
  { name: "Tue", leads: 180 },
  { name: "Wed", leads: 240 },
  { name: "Thu", leads: 210 },
  { name: "Fri", leads: 320 },
  { name: "Sat", leads: 280 },
  { name: "Sun", leads: 340 },
];

/* ===============================
   ANIMATION VARIANTS
=============================== */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function HomePage() {
  const router = useRouter();

  const go = (plan: string) => {
    router.push(`/checkout?plan=${plan}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">

      {/* LIGHTING */}
      <div className="absolute inset-0 -z-50 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.25),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_35%)]" />

      {/* NAV */}
      <Navbar />

      {/* HERO */}
      <Hero go={go} />

      {/* STATS */}
      <Stats />

      {/* ANALYTICS */}
      <Analytics />

      {/* FEATURES */}
      <Features />

      {/* PRICING */}
      <Pricing go={go} />

      {/* OPS */}
      <Operations />

      {/* CTA */}
      <CTA go={go} />

      <Footer />
    </main>
  );
}

/* ===============================
   NAVBAR
=============================== */
function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-2xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div>
          <h1 className="text-xl font-semibold">NorthSky</h1>
          <p className="text-xs text-zinc-400">Automation Infrastructure</p>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm text-zinc-400 hover:text-white">
            Features
          </a>
          <a href="#pricing" className="text-sm text-zinc-400 hover:text-white">
            Pricing
          </a>

          <a href={TELEGRAM_BOT} target="_blank">
            <Button variant="outline">Telegram</Button>
          </a>
        </div>
      </div>
    </motion.header>
  );
}

/* ===============================
   HERO
=============================== */
function Hero({ go }: any) {
  return (
    <motion.section
      initial="hidden"
      animate="show"
      variants={stagger}
      className="mx-auto grid max-w-7xl gap-16 px-6 py-28 md:grid-cols-2"
    >
      <motion.div variants={fadeUp}>
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-300">
          SaaS + Telegram Automation
        </div>

        <h1 className="mt-8 text-6xl font-semibold leading-tight">
          Operate your
          <span className="text-indigo-400"> automation SaaS</span>
        </h1>

        <p className="mt-6 text-zinc-400">
          Stripe billing, Telegram bots, lead routing, and analytics — unified.
        </p>

        <div className="mt-10 flex gap-4">
          <Button onClick={() => go("growth")}>Launch</Button>
          <a href={TELEGRAM_BOT} target="_blank">
            <Button variant="outline">Telegram</Button>
          </a>
        </div>
      </motion.div>

      {/* GLASS PANEL */}
      <motion.div variants={fadeUp}>
        <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-[0_0_80px_rgba(99,102,241,0.15)]">

          <h3 className="text-lg font-medium">Live Dashboard</h3>
          <p className="text-sm text-zinc-400">Real-time system</p>

          <div className="mt-6 space-y-3">
            <Metric title="Revenue" value="$48,220" />
            <Metric title="Leads" value="1,248" />
            <Metric title="Conversion" value="24.8%" />
          </div>

        </Card>
      </motion.div>
    </motion.section>
  );
}

/* ===============================
   STATS
=============================== */
function Stats() {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={stagger}
      className="border-y border-white/10 bg-white/[0.02]"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 py-16 md:grid-cols-4">
        {[
          ["12k+", "Leads"],
          ["$1.2M+", "Revenue"],
          ["99.9%", "Uptime"],
          ["24/7", "Automation"],
        ].map(([v, l]) => (
          <motion.div key={l} variants={fadeUp}>
            <div className="text-4xl font-semibold">{v}</div>
            <div className="text-sm text-zinc-400">{l}</div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ===============================
   ANALYTICS
=============================== */
function Analytics() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28">

      <h2 className="text-4xl font-semibold">Analytics</h2>
      <p className="mt-3 text-zinc-400">Live revenue + lead tracking</p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">

        <Card className="bg-white/5 p-6 backdrop-blur-2xl border border-white/10">
          <h3>Revenue</h3>
          <Chart type="area" dataKey="revenue" />
        </Card>

        <Card className="bg-white/5 p-6 backdrop-blur-2xl border border-white/10">
          <h3>Leads</h3>
          <Chart type="bar" dataKey="leads" />
        </Card>

      </div>
    </section>
  );
}

/* ===============================
   FEATURES (REAL MOTION GRID)
=============================== */
function Features() {
  const items = [
    "Telegram Bot System",
    "Stripe Automation",
    "Lead Engine",
    "Webhook Layer",
    "Analytics Core",
    "SaaS Backend",
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={stagger}
      className="mx-auto max-w-7xl px-6 py-28"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ scale: 1.03 }}>
            <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-2xl hover:shadow-[0_0_40px_rgba(99,102,241,0.15)]">
              {i}
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ===============================
   PRICING
=============================== */
function Pricing({ go }: any) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28">
      <div className="grid gap-6 md:grid-cols-3">

        {["Starter", "Growth", "Elite"].map((p) => (
          <Card key={p} className="bg-white/5 p-6 border border-white/10 backdrop-blur-2xl">
            <h3>{p}</h3>
            <Button className="mt-6 w-full" onClick={() => go(p.toLowerCase())}>
              Upgrade
            </Button>
          </Card>
        ))}

      </div>
    </section>
  );
}

/* ===============================
   OPS
=============================== */
function Operations() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28">
      <Card className="bg-white/5 p-8 border border-white/10 backdrop-blur-2xl">
        <h2>System Status</h2>

        <div className="mt-6 space-y-3">
          <Status label="Stripe" value="OK" />
          <Status label="Telegram" value="OK" />
          <Status label="Webhooks" value="OK" />
        </div>
      </Card>
    </section>
  );
}

/* ===============================
   CTA
=============================== */
function CTA({ go }: any) {
  return (
    <section className="text-center py-28">
      <h2 className="text-5xl font-semibold">Launch your system</h2>

      <Button className="mt-8" onClick={() => go("growth")}>
        Start
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

/* ===============================
   HELPERS
=============================== */
function Metric({ title, value }: any) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-400">{title}</span>
      <span>{value}</span>
    </div>
  );
}

function Status({ label, value }: any) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="text-emerald-400">{value}</span>
    </div>
  );
}

function Chart({ type, dataKey }: any) {
  const data = type === "area" ? revenueData : leadData;

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