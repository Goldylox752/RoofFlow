import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Calculate product performance score
 */
function calculateScore(p) {
  const views = p.views || 0;
  const purchases = p.purchases || 0;
  const revenue = Number(p.revenue || 0);

  const conversion = views > 0 ? purchases / views : 0;

  // weighted scoring system
  return (
    conversion * 60 +
    Math.log10(revenue + 1) * 20 +
    purchases * 5
  );
}

/**
 * Update ALL product intelligence
 */
export async function runFeedbackLoop() {
  const { data: metrics } = await supabase
    .from("product_metrics")
    .select("*");

  if (!metrics) return;

  for (const m of metrics) {
    const score = calculateScore(m);

    // update product brain
    await supabase
      .from("products")
      .update({
        conversion_score: score,
        sales_count: m.purchases,
        revenue: m.revenue
      })
      .eq("sku", m.sku);

    // AUTO-OPTIMIZATION RULES

    // 🔥 winner boost
    if (score > 50) {
      await supabase
        .from("products")
        .update({
          price_multiplier: 1.2 // increase price later (optional column)
        })
        .eq("sku", m.sku);
    }

    // ❌ loser suppression
    if (score < 10) {
      await supabase
        .from("products")
        .delete()
        .eq("sku", m.sku);
    }
  }
}