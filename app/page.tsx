"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  const router = useRouter();

  const go = (plan: string) => {
    router.push(`/checkout?plan=${plan}`);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero go={go} />
      <TrustBar />
      <ProblemSolution />
      <Features />
      <Pricing go={go} />
      <CTA go={go} />
      <Footer />
    </main>
  );
}

/* ================= NAV ================= */
function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="font-semibold tracking-tight">LaunchKit</div>

        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a className="hover:text-foreground" href="#features">Features</a>
          <a className="hover:text-foreground" href="#pricing">Pricing</a>
        </nav>

        <Button size="sm">Sign in</Button>
      </div>
    </header>
  );
}

/* ================= HERO ================= */
function Hero({ go }: any) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/40 to-background" />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-28 md:grid-cols-2">
        {/* LEFT */}
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Built for SaaS founders
          </p>

          <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
            Launch your SaaS
            <br />
            without rebuilding infrastructure
          </h1>

          <p className="mt-6 text-lg text-muted-foreground">
            Auth, Stripe billing, subscriptions, feature gating, and backend
            architecture—already built and production-ready.
          </p>

          <div className="mt-8 flex gap-3">
            <Button size="lg" onClick={() => go("starter")}>
              Start building
            </Button>
            <Button size="lg" variant="outline">
              View demo
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Deploy in minutes. No setup required.
          </p>
        </div>

        {/* RIGHT MOCK */}
        <div className="relative">
          <div className="rounded-2xl border bg-muted/30 p-6 shadow-xl">
            <p className="text-sm font-medium">Live Dashboard</p>

            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>MRR</span>
                <span className="text-foreground">$4,320</span>
              </div>

              <div className="flex justify-between">
                <span>Users</span>
                <span className="text-foreground">1,284</span>
              </div>

              <div className="flex justify-between">
                <span>Stripe</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>

          <div className="absolute -inset-10 -z-10 bg-indigo-500/10 blur-3xl" />
        </div>
      </div>
    </section>
  );
}

/* ================= TRUST ================= */
function TrustBar() {
  return (
    <section className="border-y py-10 text-center text-sm text-muted-foreground">
      Trusted by indie hackers building real SaaS products
    </section>
  );
}

/* ================= PROBLEM / SOLUTION ================= */
function ProblemSolution() {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-6 py-24 md:grid-cols-2">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-red-400">Before</h3>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>Building auth from scratch</li>
          <li>Complex Stripe setup</li>
          <li>No billing system</li>
          <li>Messy backend structure</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-green-400">After</h3>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>Ready-to-use authentication</li>
          <li>Stripe billing integrated</li>
          <li>Plan-based access control</li>
          <li>Scalable backend architecture</li>
        </ul>
      </Card>
    </section>
  );
}

/* ================= FEATURES ================= */
function Features() {
  const items = [
    ["Authentication", "JWT + sessions included"],
    ["Billing", "Stripe subscriptions ready"],
    ["Feature gating", "Control access by plan"],
    ["Pricing engine", "Dynamic monetization logic"],
    ["Security", "Rate limiting + middleware"],
    ["Backend", "Scalable Express architecture"],
  ];

  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-center text-3xl font-semibold">
        Everything you need to launch
      </h2>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map(([title, desc]) => (
          <Card key={title} className="p-6 transition hover:-translate-y-1">
            <div className="font-medium">{title}</div>
            <div className="mt-2 text-sm text-muted-foreground">{desc}</div>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ================= PRICING ================= */
function Pricing({ go }: any) {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-center text-3xl font-semibold">Simple pricing</h2>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <Plan title="Starter" price="$9" go={() => go("starter")} />
        <Plan title="Growth" price="$29" highlight go={() => go("growth")} />
        <Plan title="Elite" price="$79" go={() => go("elite")} />
      </div>
    </section>
  );
}

function Plan({ title, price, go, highlight }: any) {
  return (
    <Card
      className={`p-8 text-center transition ${
        highlight ? "border-primary scale-105 shadow-xl" : ""
      }`}
    >
      <div className="font-medium">{title}</div>

      <div className="mt-4 text-4xl font-semibold">{price}</div>
      <p className="text-xs text-muted-foreground">per month</p>

      <Button className="mt-6 w-full" onClick={go}>
        Get started
      </Button>
    </Card>
  );
}

/* ================= CTA ================= */
function CTA({ go }: any) {
  return (
    <section className="py-28 text-center">
      <h2 className="text-4xl font-semibold tracking-tight">
        Start building your SaaS today
      </h2>

      <p className="mt-4 text-muted-foreground">
        Focus on your product—not infrastructure.
      </p>

      <Button className="mt-8" size="lg" onClick={() => go("starter")}>
        Start now
      </Button>
    </section>
  );
}

/* ================= FOOTER ================= */
function Footer() {
  return (
    <footer className="border-t py-10 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} LaunchKit. All rights reserved.
    </footer>
  );
}