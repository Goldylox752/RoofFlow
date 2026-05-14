"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/* ===============================
   CONFIG
=============================== */
const TELEGRAM_BOT = "https://t.me/YOUR_BOT_USERNAME";

export default function HomePage() {
  const router = useRouter();

  const go = (plan) => {
    router.push(`/checkout?plan=${plan}`);
  };

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />
      <Hero go={go} />
      <Stats />
      <Features />
      <Pricing go={go} />
      <DashboardPreview />
      <CTA go={go} />
      <Footer />
      <TelegramFloat />
    </main>
  );
}

/* ===============================
   NAVBAR
=============================== */
function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            NorthSky
          </h1>

          <p className="text-xs text-muted-foreground">
            Automation Infrastructure
          </p>
        </div>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a href="#features" className="text-muted-foreground hover:text-foreground">
            Features
          </a>

          <a href="#pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </a>

          <a href={TELEGRAM_BOT} target="_blank">
            <Button variant="outline" size="sm">
              Telegram Bot
            </Button>
          </a>

          <Button size="sm">
            Dashboard
          </Button>
        </nav>
      </div>
    </header>
  );
}

/* ===============================
   HERO
=============================== */
function Hero({ go }) {
  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-500/10 via-background to-background" />

      <div className="mx-auto grid max-w-7xl items-center gap-20 px-6 py-28 md:grid-cols-2">
        <div>
          <div className="inline-flex items-center rounded-full border px-4 py-2 text-xs text-muted-foreground">
            Telegram + SaaS Infrastructure
          </div>

          <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
            Automate your
            <br />
            lead operations
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">
            Stripe billing, Telegram automation, lead routing, and analytics —
            connected into one scalable operating system.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button size="lg" onClick={() => go("growth")}>
              Start Platform
            </Button>

            <a href={TELEGRAM_BOT} target="_blank">
              <Button size="lg" variant="outline">
                Open Telegram Bot
              </Button>
            </a>
          </div>

          <div className="mt-10 flex gap-8 text-sm text-muted-foreground">
            <div>
              <div className="text-2xl font-semibold text-foreground">
                99.9%
              </div>
              uptime
            </div>

            <div>
              <div className="text-2xl font-semibold text-foreground">
                Live
              </div>
              webhook system
            </div>

            <div>
              <div className="text-2xl font-semibold text-foreground">
                24/7
              </div>
              automation
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl border border-border/50 bg-card/50 p-8 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">
                  NorthSky Dashboard
                </h3>

                <p className="text-sm text-muted-foreground">
                  Live system overview
                </p>
              </div>

              <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                LIVE
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              <Metric
                title="Revenue"
                value="$48,220"
              />

              <Metric
                title="Lead Conversion"
                value="24.8%"
              />

              <Metric
                title="Telegram Automations"
                value="1,248"
              />

              <Metric
                title="Stripe Webhooks"
                value="Operational"
              />
            </div>
          </div>

          <div className="absolute -inset-10 -z-10 bg-indigo-500/20 blur-3xl" />
        </div>
      </div>
    </section>
  );
}

/* ===============================
   STATS
=============================== */
function Stats() {
  return (
    <section className="border-y border-border/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 py-14 text-center md:grid-cols-4">
        <Stat value="12k+" label="Leads Processed" />
        <Stat value="$1.2M+" label="Tracked Revenue" />
        <Stat value="99.9%" label="System Uptime" />
        <Stat value="24/7" label="Bot Automation" />
      </div>
    </section>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="text-3xl font-semibold">
        {value}
      </div>

      <div className="mt-2 text-sm text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

/* ===============================
   FEATURES
=============================== */
function Features() {
  const items = [
    {
      title: "Telegram Automation",
      desc: "Manage leads, alerts, and workflows directly from Telegram.",
    },
    {
      title: "Stripe Billing",
      desc: "Subscriptions, payments, and automated customer upgrades.",
    },
    {
      title: "Lead Routing",
      desc: "Automatically distribute and prioritize incoming leads.",
    },
    {
      title: "Live Dashboard",
      desc: "Track analytics, conversions, and operational metrics.",
    },
    {
      title: "Webhook Engine",
      desc: "Reliable real-time event processing infrastructure.",
    },
    {
      title: "Production Backend",
      desc: "Scalable Node.js architecture with Supabase integration.",
    },
  ];

  return (
    <section
      id="features"
      className="mx-auto max-w-7xl px-6 py-28"
    >
      <div className="text-center">
        <h2 className="text-4xl font-semibold tracking-tight">
          Built for automation-first businesses
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
          Everything needed to run a modern lead automation platform.
        </p>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <Card
            key={item.title}
            className="border-border/50 bg-card/40 p-8 backdrop-blur"
          >
            <h3 className="text-lg font-medium">
              {item.title}
            </h3>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {item.desc}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ===============================
   PRICING
=============================== */
function Pricing({ go }) {
  const plans = [
    {
      title: "Starter",
      price: "$9",
      features: [
        "Telegram bot access",
        "Basic automation",
        "Stripe billing",
      ],
    },
    {
      title: "Growth",
      price: "$29",
      features: [
        "Unlimited leads",
        "Advanced workflows",
        "Priority processing",
      ],
    },
    {
      title: "Enterprise",
      price: "$79",
      features: [
        "Multi-user system",
        "Advanced analytics",
        "Dedicated infrastructure",
      ],
    },
  ];

  return (
    <section
      id="pricing"
      className="mx-auto max-w-7xl px-6 py-28"
    >
      <div className="text-center">
        <h2 className="text-4xl font-semibold">
          Pricing
        </h2>

        <p className="mt-4 text-muted-foreground">
          Flexible plans for growing automation systems.
        </p>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.title}
            className="flex flex-col border-border/50 bg-card/40 p-8 backdrop-blur"
          >
            <div className="text-xl font-medium">
              {plan.title}
            </div>

            <div className="mt-6 text-5xl font-semibold">
              {plan.price}
              <span className="text-lg text-muted-foreground">
                /mo
              </span>
            </div>

            <div className="mt-8 space-y-4">
              {plan.features.map((f) => (
                <div
                  key={f}
                  className="text-sm text-muted-foreground"
                >
                  ✓ {f}
                </div>
              ))}
            </div>

            <Button
              className="mt-10 w-full"
              onClick={() => go(plan.title.toLowerCase())}
            >
              Start {plan.title}
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ===============================
   DASHBOARD PREVIEW
=============================== */
function DashboardPreview() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28">
      <div className="rounded-3xl border border-border/50 bg-card/40 p-10 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold">
              Live Operations Dashboard
            </h2>

            <p className="mt-4 text-muted-foreground">
              Monitor payments, leads, Telegram automation, and analytics in real time.
            </p>
          </div>

          <div className="hidden rounded-full bg-green-500/20 px-4 py-2 text-sm text-green-400 md:block">
            SYSTEM ONLINE
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">
              Monthly Revenue
            </div>

            <div className="mt-3 text-3xl font-semibold">
              $48,220
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-muted-foreground">
              Active Users
            </div>

            <div className="mt-3 text-3xl font-semibold">
              1,284
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-muted-foreground">
              Webhook Success
            </div>

            <div className="mt-3 text-3xl font-semibold">
              99.98%
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ===============================
   CTA
=============================== */
function CTA({ go }) {
  return (
    <section className="px-6 py-32 text-center">
      <h2 className="text-5xl font-semibold tracking-tight">
        Launch your automation platform
      </h2>

      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
        Build a scalable SaaS system with Stripe billing,
        Telegram automation, and production-ready infrastructure.
      </p>

      <Button
        size="lg"
        className="mt-10"
        onClick={() => go("growth")}
      >
        Start Building
      </Button>
    </section>
  );
}

/* ===============================
   FLOATING TELEGRAM BUTTON
=============================== */
function TelegramFloat() {
  return (
    <a
      href={TELEGRAM_BOT}
      target="_blank"
      className="fixed bottom-6 right-6 z-50"
    >
      <Button className="shadow-2xl">
        Telegram Support
      </Button>
    </a>
  );
}

/* ===============================
   METRIC
=============================== */
function Metric({ title, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/40 p-4">
      <div className="text-sm text-muted-foreground">
        {title}
      </div>

      <div className="font-medium">
        {value}
      </div>
    </div>
  );
}

/* ===============================
   FOOTER
=============================== */
function Footer() {
  return (
    <footer className="border-t border-border/40 py-10 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} NorthSky. All rights reserved.
    </footer>
  );
}