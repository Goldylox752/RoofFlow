import { supabase } from "@/lib/supabase";

const MAX_LOAD_PER_CONTRACTOR = 10;

function scoreContractor(c: any) {
  const performance = c.performance_score ?? 5;
  const speed = c.response_speed ?? 5;
  const load = c.current_load ?? 0;
  const failures = c.failed_jobs ?? 0;
  const completed = c.completed_jobs ?? 0;

  // Strong penalty for overload
  if (load >= MAX_LOAD_PER_CONTRACTOR) {
    return -9999;
  }

  // Better contractors gain trust slowly over time
  const experienceBonus = Math.min(completed * 0.05, 3);

  // Less aggressive load penalty curve
  const loadPenalty = Math.pow(load / MAX_LOAD_PER_CONTRACTOR, 2) * 8;

  // Failure penalty scales harder
  const failurePenalty = failures * 1.5;

  // Optional recent assignment cooldown
  const cooldownPenalty = c.recently_assigned ? 3 : 0;

  return (
    performance * 2.5 +
    speed * 1.2 +
    experienceBonus -
    loadPenalty -
    failurePenalty -
    cooldownPenalty
  );
}

export async function pickContractor(
  city: string,
  contractors?: any[]
) {
  let list = contractors;

  if (!list) {
    const { data, error } = await supabase
      .from("contractors")
      .select("*")
      .eq("active", true)
      .eq("city", city);

    if (error) {
      console.error("Contractor fetch failed:", error);
      return null;
    }

    list = data || [];
  }

  if (!list.length) return null;

  // Score all contractors
  const scored = list.map((c) => ({
    contractor: c,
    score: scoreContractor(c),
  }));

  // Highest first
  scored.sort((a, b) => b.score - a.score);

  // Randomize among top 3 to prevent monopoly
  const topCandidates = scored.slice(0, 3);

  const selected =
    topCandidates[
      Math.floor(Math.random() * topCandidates.length)
    ];

  return selected.contractor;
}