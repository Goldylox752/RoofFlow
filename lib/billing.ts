import { db } from "@/lib/db";

export async function getUserPlan(orgId) {
  const sub = await db.subscription.findFirst({
    where: { orgId },
  });

  return sub?.plan || "free";
}

export function isPro(plan) {
  return plan === "pro" || plan === "enterprise";
}