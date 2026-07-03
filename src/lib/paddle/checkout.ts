import {
  getPaddleApiBaseUrl,
  getPaddleCheckoutUrl,
  getPaddlePriceId,
  normalizeBillingCycle,
  normalizePaddlePlan,
} from "./config";

export type PaddleCheckoutRequest = {
  plan?: string;
  billingCycle?: string;
  email?: string;
  userId?: string;
};

type PaddleTransactionResponse = {
  data?: {
    id?: string;
    checkout?: {
      url?: string | null;
    } | null;
  };
  error?: {
    detail?: string;
  };
  errors?: Array<{
    detail?: string;
  }>;
};

export async function createPaddleCheckout(body: PaddleCheckoutRequest, origin: string) {
  const apiKey = process.env.PADDLE_API_KEY;

  if (!apiKey) {
    throw new Error("Paddle API key is missing.");
  }

  const plan = normalizePaddlePlan(body.plan);
  const billingCycle = normalizeBillingCycle(body.billingCycle);
  const priceId = getPaddlePriceId(plan, billingCycle);

  if (!priceId) {
    throw new Error(`${plan} ${billingCycle} checkout is not configured yet.`);
  }

  const checkoutUrl = getPaddleCheckoutUrl(origin);
  const response = await fetch(`${getPaddleApiBaseUrl()}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          price_id: priceId,
          quantity: 1,
        },
      ],
      custom_data: {
        plan,
        billing_cycle: billingCycle,
        user_id: body.userId ?? "",
      },
      checkout: {
        url: checkoutUrl,
      },
    }),
  });

  const transaction = (await response.json()) as PaddleTransactionResponse;

  if (!response.ok) {
    throw new Error(
      transaction.errors?.[0]?.detail ??
        transaction.error?.detail ??
        "Unable to create Paddle checkout.",
    );
  }

  const url = transaction.data?.checkout?.url;

  if (!url) {
    throw new Error("Paddle did not return a checkout URL.");
  }

  return {
    url,
    transactionId: transaction.data?.id,
  };
}
