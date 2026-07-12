import { getPaddleApiBaseUrl } from "./config";

type PaddleSubscriptionResponse = {
  data?: {
    id?: string;
    status?: string;
    next_billed_at?: string | null;
    scheduled_change?: {
      action?: string;
      effective_at?: string;
    } | null;
  };
  error?: {
    detail?: string;
  };
  errors?: Array<{
    detail?: string;
  }>;
};

function validateSubscriptionId(subscriptionId: string) {
  if (!/^sub_[a-z0-9]{10,}$/i.test(subscriptionId)) {
    throw new Error("The company does not have a valid Paddle subscription ID.");
  }
}

async function paddleSubscriptionRequest(
  subscriptionId: string,
  method: "POST" | "PATCH",
  body: Record<string, unknown>,
) {
  validateSubscriptionId(subscriptionId);
  const apiKey = process.env.PADDLE_API_KEY;

  if (!apiKey) {
    throw new Error("Paddle API key is missing.");
  }

  const response = await fetch(
    `${getPaddleApiBaseUrl()}/subscriptions/${encodeURIComponent(subscriptionId)}${method === "POST" ? "/cancel" : ""}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
  const result = (await response.json()) as PaddleSubscriptionResponse;

  if (!response.ok) {
    throw new Error(
      result.errors?.[0]?.detail ??
        result.error?.detail ??
        "Paddle could not update this subscription.",
    );
  }

  if (!result.data?.id) {
    throw new Error("Paddle did not return the updated subscription.");
  }

  return result.data;
}

export async function schedulePaddleSubscriptionCancellation(subscriptionId: string) {
  return paddleSubscriptionRequest(subscriptionId, "POST", {
    effective_from: "next_billing_period",
  });
}

export async function removePaddleSubscriptionCancellation(subscriptionId: string) {
  return paddleSubscriptionRequest(subscriptionId, "PATCH", {
    scheduled_change: null,
  });
}
