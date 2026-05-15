import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { forecastRevenue } from "@/server/ai/revenueForecast";
import { Card } from "@/components/ui/card";

export default async function HomePage() {
  const { orgId } = auth();

  if (!orgId) {
    return (
      <div className="p-6">
        No organization selected
      </div>
    );
  }

  const leads = await db.lead.findMany({
    where: { orgId },
  });

  const total = leads.length;

  const pipelineValue = leads.reduce(
    (sum, l) => sum + (l.value || 0),
    0
  );

  const avgScore =
    total === 0
      ? 0
      : leads.reduce((a, b) => a + b.score, 0) / total;

  const forecast = await forecastRevenue(leads);

  const activeLeads = leads.filter(
    (l) => l.status !== "won" && l.status !== "lost"
  );

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold">
          AI Revenue System
        </h1>

        <p className="text-white/60 text-sm">
          Autonomous sales intelligence overview
        </p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <Kpi label="Total Leads" value={total} />
        <Kpi label="Avg Score" value={avgScore.toFixed(1)} />
        <Kpi label="Pipeline Value" value={`$${pipelineValue}`} />
        <Kpi
          label="Forecast (30d)"
          value={`$${forecast.forecast_30_days}`}
        />

      </div>

      {/* AI INSIGHT PANEL */}
      <Card>
        <h2 className="font-semibold">
          AI Insight
        </h2>

        <p className="text-white/70 text-sm mt-2">
          Confidence: {forecast.confidence}%
        </p>

        <p className="text-white/70 text-sm mt-2">
          {forecast.insights}
        </p>
      </Card>

      {/* SYSTEM STATUS */}
      <Card>
        <h2 className="font-semibold mb-3">
          System Status
        </h2>

        <div className="grid grid-cols-3 text-sm gap-4">

          <div>
            <div className="text-xl font-semibold">
              {activeLeads.length}
            </div>
            <div className="text-white/60">
              Active Leads
            </div>
          </div>

          <div>
            <div className="text-xl font-semibold">
              {leads.filter(l => l.status === "won").length}
            </div>
            <div className="text-white/60">
              Closed Deals
            </div>
          </div>

          <div>
            <div className="text-xl font-semibold">
              {leads.filter(l => l.status === "new").length}
            </div>
            <div className="text-white/60">
              New Intake
            </div>
          </div>

        </div>
      </Card>

      {/* QUICK ACTIONS */}
      <Card>
        <h2 className="font-semibold mb-3">
          Quick Actions
        </h2>

        <div className="flex gap-3 flex-wrap">

          <ActionButton href="/leads">
            View Leads
          </ActionButton>

          <ActionButton href="/pipeline">
            Open Pipeline
          </ActionButton>

          <ActionButton href="/ai">
            AI Control Panel
          </ActionButton>

          <ActionButton href="/analytics">
            Analytics
          </ActionButton>

        </div>
      </Card>

    </div>
  );
}

/* ===============================
   KPI COMPONENT
=============================== */
function Kpi({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="border border-white/10 rounded-xl p-4">
      <div className="text-white/60 text-sm">
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1">
        {value}
      </div>
    </div>
  );
}

/* ===============================
   ACTION BUTTON
=============================== */
function ActionButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="px-3 py-2 text-sm border border-white/20 rounded hover:bg-white hover:text-black transition"
    >
      {children}
    </a>
  );
}