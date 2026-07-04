import { createHmac, timingSafeEqual } from "crypto";
import {
  sendPaymentFailedEmail,
  sendPaymentSuccessfulEmail,
  sendSubscriptionActivatedEmail,
  sendSubscriptionCancelledEmail,
} from "@/src/lib/email";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import {
  normalizeBillingCycle,
  normalizePaddlePlan,
  paddlePriceIds,
  planToDatabaseValue,
  type PaddleBillingCycle,
  type PaddlePlan,
} from "./config";

type PaddleWebhookEvent = {
  event_id?: string;
  event_type?: string;
  data?: PaddleWebhookData;
};

type PaddleWebhookData = {
  id?: string;
  customer_id?: string | null;
  subscription_id?: string | null;
  status?: string;
  custom_data?: {
    plan?: string;
    billing_cycle?: string;
    user_id?: string;
  } | null;
  items?: Array<{
    price?: {
      id?: string;
    };
    price_id?: string;
  }>;
};

const activeStatuses = new Set(["active", "trialing"]);
const inactiveStatuses = new Set(["canceled", "paused"]);

function parsePaddleSignature(signature: string) {
  return signature.split(";").reduce<Record<string, string[]>>((values, part) => {
    const [key, value] = part.split("=");

    if (!key || !value) {
      return values;
    }

    return {
      ...values,
      [key]: [...(values[key] ?? []), value],
    };
  }, {});
}

export function verifyPaddleWebhookSignature(rawBody: string, signature: string, secret: string) {
  const parts = parsePaddleSignature(signature);
  const timestamp = parts.ts?.[0];
  const signatures = parts.h1 ?? [];

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const timestampMs = Number(timestamp) * 1000;

  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}:${rawBody}`, "utf8")
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return signatures.some((candidate) => {
    const candidateBuffer = Buffer.from(candidate, "hex");

    return (
      candidateBuffer.length === expectedBuffer.length &&
      timingSafeEqual(candidateBuffer, expectedBuffer)
    );
  });
}

function planFromPriceId(priceId: string | undefined): PaddlePlan | null {
  if (!priceId) {
    return null;
  }

  for (const [plan, cycleMap] of Object.entries(paddlePriceIds) as Array<
    [PaddlePlan, Record<PaddleBillingCycle, string>]
  >) {
    if (cycleMap.monthly === priceId || cycleMap.yearly === priceId) {
      return plan;
    }
  }

  return null;
}

function getWebhookPlan(data: PaddleWebhookData) {
  return data.custom_data?.plan
    ? normalizePaddlePlan(data.custom_data.plan)
    : planFromPriceId(data.items?.[0]?.price?.id ?? data.items?.[0]?.price_id) ?? "Pro";
}

function getSubscriptionStatus(eventType: string, dataStatus: string | undefined) {
  if (eventType === "transaction.completed") {
    return "active";
  }

  if (eventType === "subscription.past_due") {
    return "past_due";
  }

  if (eventType === "subscription.canceled") {
    return "canceled";
  }

  if (dataStatus && activeStatuses.has(dataStatus)) {
    return dataStatus;
  }

  if (dataStatus && inactiveStatuses.has(dataStatus)) {
    return dataStatus;
  }

  return dataStatus ?? "active";
}

async function findCompanyId(userId: string | undefined, subscriptionId: string | undefined) {
  const supabase = createSupabaseAdminClient();

  if (userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }

    return data?.company_id as string | undefined;
  }

  if (subscriptionId) {
    const { data, error } = await supabase
      .from("companies")
      .select("id")
      .eq("paddle_subscription_id", subscriptionId)
      .single();

    if (error) {
      throw error;
    }

    return data?.id as string | undefined;
  }

  return undefined;
}

export async function handlePaddleWebhook(rawBody: string) {
  const event = JSON.parse(rawBody) as PaddleWebhookEvent;
  const eventType = event.event_type ?? "";
  const data = event.data;

  if (!data || (!eventType.startsWith("subscription.") && eventType !== "transaction.completed")) {
    return;
  }

  const subscriptionId = data.id?.startsWith("sub_") ? data.id : data.subscription_id ?? undefined;
  const companyId = await findCompanyId(data.custom_data?.user_id, subscriptionId);

  if (!companyId) {
    return;
  }

  const plan = getWebhookPlan(data);
  const subscriptionStatus = getSubscriptionStatus(eventType, data.status);
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("companies")
    .update({
      plan: planToDatabaseValue(plan),
      subscription_status: subscriptionStatus,
      payment_provider: "paddle",
      paddle_customer_id: data.customer_id ?? null,
      paddle_subscription_id: subscriptionId ?? null,
      billing_cycle: normalizeBillingCycle(data.custom_data?.billing_cycle),
    })
    .eq("id", companyId);

  if (error) {
    throw error;
  }

  const { data: company } = await supabase
    .from("companies")
    .select("name, email")
    .eq("id", companyId)
    .single();

  if (!company?.email) {
    return;
  }

  const emailInput = {
    to: company.email as string,
    companyName: company.name ?? "your company",
    plan,
  };

  if (eventType === "transaction.completed") {
    await sendPaymentSuccessfulEmail(emailInput);
    await sendSubscriptionActivatedEmail(emailInput);
    return;
  }

  if (eventType === "subscription.past_due") {
    await sendPaymentFailedEmail(emailInput);
    return;
  }

  if (eventType === "subscription.canceled") {
    await sendSubscriptionCancelledEmail(emailInput);
  }
}
