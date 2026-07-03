export type PaddleBillingCycle = "monthly" | "yearly";
export type PaddlePlan = "Basic" | "Pro" | "Ultra";

export const paddlePriceIds: Record<PaddlePlan, Record<PaddleBillingCycle, string>> = {
  Basic: {
    monthly: process.env.PADDLE_BASIC_MONTHLY_PRICE_ID ?? "pri_01kwk4bkm7y5h2e65jqnchk0n9",
    yearly: process.env.PADDLE_BASIC_YEARLY_PRICE_ID ?? "pri_01kwk4g53xtzv1wpj72hk66qge",
  },
  Pro: {
    monthly: process.env.PADDLE_PRO_MONTHLY_PRICE_ID ?? "pri_01kwk4kjnae6t4mz6sm9zyzd2f",
    yearly: process.env.PADDLE_PRO_YEARLY_PRICE_ID ?? "pri_01kwk4n0g6xjfdy94snsrg7vyf",
  },
  Ultra: {
    monthly: process.env.PADDLE_ULTRA_MONTHLY_PRICE_ID ?? "pri_01kwk4qmszmyqfcget635s7kq8",
    yearly: process.env.PADDLE_ULTRA_YEARLY_PRICE_ID ?? "pri_01kwk4rqns3qf1dg8fb03qtr58",
  },
};

export function normalizePaddlePlan(plan: string | undefined): PaddlePlan {
  if (plan === "Basic" || plan === "Ultra") {
    return plan;
  }

  return "Pro";
}

export function normalizeBillingCycle(billingCycle: string | undefined): PaddleBillingCycle {
  return billingCycle === "yearly" ? "yearly" : "monthly";
}

export function getPaddleApiBaseUrl() {
  if (process.env.PADDLE_API_BASE_URL) {
    return process.env.PADDLE_API_BASE_URL.replace(/\/$/, "");
  }

  const environment = process.env.PADDLE_ENVIRONMENT ?? process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT;

  return environment === "sandbox"
    ? "https://api.sandbox.paddle.com"
    : "https://api.paddle.com";
}

export function getPaddleCheckoutUrl(origin: string) {
  const configuredCheckoutUrl = process.env.PADDLE_CHECKOUT_URL;

  if (configuredCheckoutUrl) {
    return configuredCheckoutUrl;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? origin;

  return `${appUrl}/paddle-checkout`;
}

export function getPaddlePriceId(plan: PaddlePlan, billingCycle: PaddleBillingCycle) {
  return paddlePriceIds[plan][billingCycle];
}

export function planToDatabaseValue(plan: PaddlePlan) {
  return plan.toLowerCase();
}
