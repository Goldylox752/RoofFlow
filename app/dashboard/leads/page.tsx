"use client";

import { useEffect, useState } from "react";

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);

  async function load() {
    const res = await fetch("/api/analytics/top-leads");
    const json = await res.json();
    setLeads(json.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 bg-black text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Top Leads</h1>

      <div className="space-y-2">
        {leads.map((lead: any) => (
          <div
            key={lead.id}
            className="p-4 bg-zinc-900 rounded-xl flex justify-between"
          >
            <div>
              <p className="font-bold">{lead.email || "No email"}</p>
              <p className="text-gray-400 text-sm">
                Score: {lead.score} • Tier: {lead.tier}
              </p>
            </div>

            <div className="text-green-400 font-bold">
              ${lead.price}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}