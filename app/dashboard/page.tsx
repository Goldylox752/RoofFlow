"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/analytics/overview");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // live refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-white bg-black min-h-screen">
        Loading dashboard...
      </div>
    );
  }

  const revenue = data?.revenue;
  const leads = data?.leads;

  return (
    <div className="p-6 bg-black text-white min-h-screen space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">NorthSky Dashboard</h1>
        <p className="text-gray-400">AI SaaS Revenue Control Panel</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-gray-400">Total Revenue</p>
          <h2 className="text-2xl font-bold">
            ${revenue?.totalRevenue || 0}
          </h2>
        </div>

        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-gray-400">MRR</p>
          <h2 className="text-2xl font-bold">
            ${revenue?.mrr || 0}
          </h2>
        </div>

        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-gray-400">Conversion Rate</p>
          <h2 className="text-2xl font-bold">
            {(leads?.conversionRate * 100 || 0).toFixed(1)}%
          </h2>
        </div>

      </div>

      {/* LEAD METRICS */}
      <div className="bg-zinc-900 p-4 rounded-xl">
        <h2 className="text-xl font-semibold mb-2">Lead Intelligence</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
          <div>Total Leads: {leads?.totalLeads}</div>
          <div>Converted: {leads?.converted}</div>
          <div>Avg Score: {leads?.avgScore}</div>
          <div>Conversion: {(leads?.conversionRate * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* SIMPLE CHART (SIMULATED TREND) */}
      <div className="bg-zinc-900 p-4 rounded-xl h-64">
        <h2 className="text-xl font-semibold mb-2">Revenue Trend</h2>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={[
              { name: "Mon", value: 200 },
              { name: "Tue", value: 400 },
              { name: "Wed", value: 300 },
              { name: "Thu", value: 600 },
              { name: "Fri", value: revenue?.totalRevenue || 800 },
            ]}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#22c55e" />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}