import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { forecastRevenue } from "@/server/ai/revenueForecast";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const { orgId } = auth();

  if (!orgId) {
    return (
      <div className="p-6 text-white">
        No organization selected
      </div>
    );
  }

  const leads = await db.lead.findMany({
    where: { orgId },
  });

  const totalLeads = leads.length;

  const avgScore =
    totalLeads === 0
      ? 0
      : leads.reduce((a, b) => a + b.score, 0) / totalLeads;

  const pipelineValue = leads.reduce(
    (sum, l) => sum + (l.value || 0),
    0
  );

  const forecast = await forecastRevenue(leads);

  const hotLeads = leads
    .filter((l) => l.score >= 70)
    .slice(0, 5);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold">
          AI Revenue Command Center
        </h1>

        <p className="text-white/60 text-sm">
          Autonomous revenue intelligence dashboard
        </p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <Kpi label="Total Leads" value={totalLeads} />
        <Kpi label="Avg Lead Score" value={avgScore.toFixed(1)} />
        <Kpi label="Pipeline Value" value={`$${pipelineValue}`} />
        <Kpi label="30-Day Forecast" value={`$${forecast.forecast_30_days}`} />

      </div>

      {/* AI INSIGHT PANEL */}
      <Card>
        <h2 className="font-semibold mb-2">
          AI Revenue Insight
        </h2>

        <p className="text-white/70 text-sm">
          Confidence: {forecast.confidence}%
        </p>

        <p className="text-white/70 text-sm mt-2">
          {forecast.insights}
        </p>
      </Card>

      {/* HOT LEADS */}
      <Card>
        <h2 className="font-semibold mb-3">
          High-Intent Leads
        </h2>

        <div className="space-y-2">
          {hotLeads.length === 0 && (
            <p className="text-white/60 text-sm">
              No high-intent leads detected
            </p>
          )}

          {hotLeads.map((lead) => (
            <div
              key={lead.id}
              className="flex justify-between border-b border-white/10 py-2 text-sm"
            >
              <div>
                <div>{lead.city}</div>
                <div className="text-white/50 text-xs">
                  {lead.category}
                </div>
              </div>

              <div className="text-right">
                <div>${lead.value}</div>
                <div className="text-white/50 text-xs">
                  Score: {lead.score}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* PIPELINE SNAPSHOT */}
      <Card>
        <h2 className="font-semibold mb-3">
          Pipeline Overview
        </h2>

        <div className="grid grid-cols-3 gap-4 text-sm">

          <div>
            <div className="text-xl font-semibold">
              {leads.filter(l => l.status === "new").length}
            </div>
            <div className="text-white/60">New</div>
          </div>

          <div>
            <div className="text-xl font-semibold">
              {leads.filter(l => l.status === "contacted").length}
            </div>
            <div className="text-white/60">Contacted</div>
          </div>

          <div>
            <div className="text-xl font-semibold">
              {leads.filter(l => l.status === "won").length}
            </div>
            <div className="text-white/60">Won</div>
          </div>

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
      <div className="text-white/60 text-sm">{label}</div>
      <div className="text-2xl font-semibold mt-1">
        {value}
      </div>
    </div>
  );
}