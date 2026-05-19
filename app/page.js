"use client";

import { useEffect } from "react";

export default function Page() {

  // simple live feed simulation
  useEffect(() => {
    const feed = document.getElementById("live-feed");

    const items = [
      "New roofing inquiry — Austin, TX",
      "Storm damage lead — Denver, CO",
      "Inspection request — Calgary, AB",
      "Emergency repair — Phoenix, AZ",
    ];

    if (!feed) return;

    const interval = setInterval(() => {
      const item = items[Math.floor(Math.random() * items.length)];

      const el = document.createElement("div");
      el.className =
        "p-3 bg-slate-900/60 border border-white/5 rounded-lg text-sm text-slate-200";
      el.innerText = item;

      feed.prepend(el);

      if (feed.children.length > 5) {
        feed.removeChild(feed.lastChild);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen text-white bg-gradient-to-b from-slate-950 via-slate-900 to-black">

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/40 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">

          <div className="text-2xl font-black tracking-tight">
            ROOF<span className="text-green-400">FLOW</span>
          </div>

          <div className="hidden md:flex gap-8 text-sm text-slate-300">
            <a href="#features" className="hover:text-green-400">Features</a>
            <a href="#workflow" className="hover:text-green-400">Workflow</a>
            <a href="#results" className="hover:text-green-400">Results</a>
            <a href="#cta" className="hover:text-green-400">Start</a>
          </div>

          <button className="px-5 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-semibold">
            Request Demo
          </button>

        </div>
      </nav>

      {/* HERO */}
      <section className="pt-40 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">

          <div>
            <h1 className="text-5xl font-black leading-tight">
              Turn roofing leads into predictable revenue
            </h1>

            <p className="text-slate-300 mt-6 text-lg">
              RoofFlow helps contractors capture, qualify, and convert high-intent roofing demand in real time.
            </p>

            <div className="flex gap-4 mt-8">
              <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 font-semibold">
                Start Demo
              </button>

              <a href="#features" className="px-6 py-3 rounded-xl border border-white/10 bg-white/5">
                View Features
              </a>
            </div>
          </div>

          {/* LIVE FEED */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 font-bold mb-4">
              ⚡ Live Pipeline Feed
            </div>

            <div id="live-feed" className="space-y-3"></div>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">

          <h2 className="text-4xl font-black">
            Built for roofing contractors
          </h2>

          <p className="text-slate-400 mt-3">
            Capture demand, qualify faster, and close more jobs.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-12 text-left">

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-bold text-xl">Lead Capture</h3>
              <p className="text-slate-400 mt-2 text-sm">
                Automatically structure incoming roofing demand.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-bold text-xl">Smart Qualification</h3>
              <p className="text-slate-400 mt-2 text-sm">
                Score leads by urgency, damage, and location.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-bold text-xl">CRM Sync</h3>
              <p className="text-slate-400 mt-2 text-sm">
                Push qualified jobs into your workflow instantly.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center bg-white/5 border border-white/10 rounded-2xl p-10">

          <h2 className="text-3xl font-black">From lead → job in minutes</h2>

          <div className="grid md:grid-cols-3 gap-6 mt-10 text-slate-300">

            <div>
              <div className="text-2xl font-bold text-green-400">1</div>
              Capture demand
            </div>

            <div>
              <div className="text-2xl font-bold text-green-400">2</div>
              Qualify instantly
            </div>

            <div>
              <div className="text-2xl font-bold text-green-400">3</div>
              Close faster
            </div>

          </div>

        </div>
      </section>

      {/* RESULTS */}
      <section id="results" className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">

          <h2 className="text-4xl font-black">Performance impact</h2>

          <div className="grid md:grid-cols-3 gap-8 mt-12">

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-3xl font-black text-green-400">+42%</div>
              <div className="text-sm text-slate-400 mt-2">faster response</div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-3xl font-black text-green-400">+28%</div>
              <div className="text-sm text-slate-400 mt-2">conversion rate</div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-3xl font-black text-green-400">-35%</div>
              <div className="text-sm text-slate-400 mt-2">wasted leads</div>
            </div>

          </div>

        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center bg-white/5 border border-white/10 rounded-2xl p-10">

          <h2 className="text-4xl font-black">
            Ready to scale your pipeline?
          </h2>

          <p className="text-slate-400 mt-3">
            Start using RoofFlow today.
          </p>

          <button className="mt-8 px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-green-500 to-blue-500">
            Book Demo
          </button>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-slate-500 text-sm">
        © 2026 RoofFlow. All rights reserved.
      </footer>

    </main>
  );
}