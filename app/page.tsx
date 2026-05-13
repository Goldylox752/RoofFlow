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
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="font-bold">LaunchKit</div>

        <nav className="hidden gap-6 text-sm opacity-70 md:flex">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </nav>

        <Button size="sm">Get Started</Button>
      </div>
    </header>
  );
}

/* ================= HERO ================= */
function Hero({ go }: any) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center">
      <div className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
        Built for modern SaaS founders
      </div>

      <h1 className="text-4xl font-bold leading-tight md:text-6xl">
        Ship your SaaS faster than ever before
      </h1>

      <p className="mt-6 text-lg text-muted-foreground">
        Everything you need is already built: authentication, Stripe billing,
        subscriptions, and scalable backend architecture.
      </p>

      <div className="mt-8 flex justify-center gap-3">
        <Button size="lg" onClick={() => go("starter")}>
          Start for $9/mo
        </Button>

        <Button variant="outline" size="lg" onClick={() => go("growth")}>
          View plans
        </Button>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        No setup. No boilerplate. Launch in minutes.
      </p>
    </section>
  );
}

/* ================= TRUST ================= */
function TrustBar() {
  return (
    <section className="border-y bg-muted/30 py-10 text-center text-sm text-muted-foreground">
      Used by indie hackers and startups building real SaaS products
    </section>
  );
}

/* ============== PROBLEM / SOLUTION ============== */
function ProblemSolution() {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-red-400">
          What slows you down
        </h3>

        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Rebuilding auth systems from scratch</li>
          <li>Complex Stripe integration setup</li>
          <li>No subscription or billing logic</li>
          <li>Messy backend architecture decisions</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-green-400">
          What you get instead
        </h3>

        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Fully built authentication system</li>
          <li>Stripe subscriptions ready to go</li>
          <li>Plan-based feature control</li>
          <li>Production-ready backend structure</li>
        </ul>
      </Card>
    </section>
  );
}

/* ================= FEATURES ================= */
function Features() {
  const items = [
    ["Authentication", "JWT + session management built-in"],
    ["Billing", "Stripe subscriptions + webhooks ready"],
    ["Feature Control", "Restrict features by plan"],
    ["Pricing Engine", "Dynamic pricing system included"],
    ["Security", "Rate limiting + middleware protection"],
    ["Scalable Backend", "Clean Express architecture"],
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-center text-3xl font-bold">
        Everything included out of the box
      </h2>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {items.map(([title, desc]) => (
          <Card key={title} className="p-5">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ================= PRICING ================= */
function Pricing({ go }: any) {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-center text-3xl font-bold">Simple pricing</h2>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Plan title="Starter" price="$9" go={() => go("starter")} />
        <Plan title="Growth" price="$29" go={() => go("growth")} />
        <Plan title="Elite" price="$79" go={() => go("elite")} />
      </div>
    </section>
  );
}

function Plan({ title, price, go }: any) {
  return (
    <Card className="p-6 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="mt-4 text-3xl font-bold">{price}</p>
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
    <section className="py-24 text-center">
      <h2 className="text-3xl font-bold">
        Launch your SaaS in minutes, not months
      </h2>

      <p className="mt-4 text-muted-foreground">
        Stop building infrastructure. Start building your product.
      </p>

      <Button className="mt-6" size="lg" onClick={() => go("starter")}>
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