const supabase = require("../lib/supabase");

/* ===============================
   REVENUE METRICS
=============================== */
async function getRevenueStats() {
  const { data: payments } = await supabase
    .from("payments")
    .select("amount, created_at");

  const totalRevenue =
    payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

  const mrr =
    totalRevenue / 1; // simple placeholder (can upgrade later)

  return {
    totalRevenue,
    mrr,
    totalPayments: payments?.length || 0,
  };
}

/* ===============================
   LEAD STATS
=============================== */
async function getLeadStats() {
  const { data: leads } = await supabase
    .from("leads")
    .select("score, converted, revenue");

  const totalLeads = leads?.length || 0;
  const converted = leads?.filter(l => l.converted).length || 0;

  const avgScore =
    leads?.reduce((s, l) => s + (l.score || 0), 0) / (totalLeads || 1);

  const conversionRate = totalLeads ? converted / totalLeads : 0;

  return {
    totalLeads,
    converted,
    conversionRate,
    avgScore: Math.round(avgScore),
  };
}

/* ===============================
   TOP LEADS
=============================== */
async function getTopLeads(limit = 10) {
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("score", { ascending: false })
    .limit(limit);

  return data || [];
}

module.exports = {
  getRevenueStats,
  getLeadStats,
  getTopLeads,
};