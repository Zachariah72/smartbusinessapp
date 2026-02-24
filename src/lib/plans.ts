export type PlanKey = "starter" | "basic" | "pro" | "business";

export const PLAN_LABELS: Record<PlanKey, string> = {
  starter: "Starter",
  basic: "Basic",
  pro: "Pro",
  business: "Business",
};

export const PLAN_PRICES: Record<PlanKey, string> = {
  starter: "KES 0",
  basic: "KES 999",
  pro: "KES 2,999",
  business: "KES 5,999+",
};

export const PLAN_ORDER: PlanKey[] = ["starter", "basic", "pro", "business"];

export function getNextPlan(plan: PlanKey): PlanKey | null {
  const idx = PLAN_ORDER.indexOf(plan);
  if (idx === -1 || idx === PLAN_ORDER.length - 1) return null;
  return PLAN_ORDER[idx + 1];
}
