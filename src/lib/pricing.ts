export type ComvexaPlanName = "Basic" | "Pro" | "Ultra";
export type ComvexaBillingCycle = "monthly" | "yearly";

export const comvexaPrices: Record<
  ComvexaPlanName,
  Record<ComvexaBillingCycle, number>
> = {
  Basic: { monthly: 15.99, yearly: 139.99 },
  Pro: { monthly: 49.99, yearly: 449.99 },
  Ultra: { monthly: 99.99, yearly: 899.99 },
};

export function getComvexaPrice(plan: string, billingCycle: ComvexaBillingCycle) {
  const normalizedPlan: ComvexaPlanName =
    plan === "Basic" || plan === "Ultra" ? plan : "Pro";

  return comvexaPrices[normalizedPlan][billingCycle];
}

export function getEffectiveMonthlyPrice(plan: string) {
  return getComvexaPrice(plan, "yearly") / 12;
}
