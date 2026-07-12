import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import {
  removePaddleSubscriptionCancellation,
  schedulePaddleSubscriptionCancellation,
} from "@/src/lib/paddle/subscription";

const cancellationReasons = new Set([
  "too_expensive",
  "not_using_enough",
  "missing_features",
  "difficult_to_use",
  "switching_product",
  "technical_issues",
  "business_closed",
  "temporary_pause",
  "other",
]);

const retentionFactors = new Set([
  "lower_price",
  "missing_feature",
  "onboarding_help",
  "temporary_pause",
  "better_support",
  "nothing",
  "other",
]);

type CancellationBody = {
  reason?: unknown;
  retentionFactor?: unknown;
  feedback?: unknown;
  confirmed?: unknown;
};

type CompanySubscription = {
  id: string;
  plan: string | null;
  subscription_status: string | null;
  paddle_subscription_id: string | null;
  cancellation_scheduled_at: string | null;
  cancellation_effective_at: string | null;
  cancellation_reason: string | null;
  cancellation_retention_factor: string | null;
  cancellation_feedback: string | null;
  cancellation_withdrawn_at: string | null;
};

function bearerToken(request: Request) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
}

function setupError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.includes("cancellation_")
  );
}

async function getCompanySubscription(request: Request) {
  const token = bearerToken(request);

  if (!token) {
    return { error: Response.json({ error: "You must be signed in to manage a subscription." }, { status: 401 }) };
  }

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    return { error: Response.json({ error: "Invalid session." }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile?.company_id) {
    return { error: Response.json({ error: "Your profile is not connected to a company." }, { status: 400 }) };
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select(
      "id, plan, subscription_status, paddle_subscription_id, cancellation_scheduled_at, cancellation_effective_at, cancellation_reason, cancellation_retention_factor, cancellation_feedback, cancellation_withdrawn_at",
    )
    .eq("id", profile.company_id)
    .single();

  if (companyError) {
    if (setupError(companyError)) {
      return {
        error: Response.json(
          { error: "Apply the Supabase cancellation migration before enabling plan cancellation.", setupRequired: true },
          { status: 503 },
        ),
      };
    }

    throw companyError;
  }

  return {
    supabase,
    userId: userData.user.id,
    company: company as CompanySubscription,
  };
}

function cancellationState(company: CompanySubscription) {
  const status = String(company.subscription_status ?? "inactive").toLowerCase();
  const scheduled = Boolean(company.cancellation_scheduled_at && company.cancellation_effective_at);
  const hasSubscription = Boolean(company.paddle_subscription_id);

  return {
    available: hasSubscription && ["active", "trialing"].includes(status) && !scheduled,
    hasSubscription,
    scheduled,
    effectiveAt: company.cancellation_effective_at,
    scheduledAt: company.cancellation_scheduled_at,
    plan: company.plan,
    subscriptionStatus: status,
    reason: company.cancellation_reason,
  };
}

export async function GET(request: Request) {
  try {
    const result = await getCompanySubscription(request);
    if (result.error) return result.error;
    return Response.json(cancellationState(result.company));
  } catch (error) {
    console.error("Could not load subscription cancellation state", error);
    return Response.json({ error: "Could not load cancellation settings." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await getCompanySubscription(request);
    if (result.error) return result.error;

    const { supabase, userId, company } = result;
    const body = (await request.json().catch(() => ({}))) as CancellationBody;
    const reason = typeof body.reason === "string" ? body.reason : "";
    const retentionFactor = typeof body.retentionFactor === "string" ? body.retentionFactor : "nothing";
    const feedback = typeof body.feedback === "string" ? body.feedback.trim().slice(0, 1200) : "";

    if (!cancellationReasons.has(reason)) {
      return Response.json({ error: "Choose the main reason you are canceling." }, { status: 400 });
    }

    if (!retentionFactors.has(retentionFactor)) {
      return Response.json({ error: "Choose what might have helped you stay." }, { status: 400 });
    }

    if (body.confirmed !== true) {
      return Response.json({ error: "Confirm that you understand when cancellation takes effect." }, { status: 400 });
    }

    const state = cancellationState(company);

    if (state.scheduled) {
      return Response.json({ error: "This subscription is already scheduled to cancel." }, { status: 409 });
    }

    if (!state.available || !company.paddle_subscription_id) {
      return Response.json({ error: "This company does not have an active Paddle subscription to cancel." }, { status: 409 });
    }

    const paddleSubscription = await schedulePaddleSubscriptionCancellation(company.paddle_subscription_id);
    const effectiveAt = paddleSubscription.scheduled_change?.effective_at ?? null;
    const scheduledAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        cancellation_scheduled_at: scheduledAt,
        cancellation_effective_at: effectiveAt,
        cancellation_reason: reason,
        cancellation_retention_factor: retentionFactor,
        cancellation_feedback: feedback || null,
        cancellation_requested_by: userId,
        cancellation_withdrawn_at: null,
      })
      .eq("id", company.id);

    if (updateError) {
      console.error("Paddle cancellation succeeded but feedback could not be recorded", updateError);
    }

    return Response.json({
      scheduled: true,
      effectiveAt,
      scheduledAt,
      subscriptionStatus: paddleSubscription.status ?? company.subscription_status,
      feedbackRecorded: !updateError,
    });
  } catch (error) {
    console.error("Could not schedule subscription cancellation", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not cancel this subscription." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const result = await getCompanySubscription(request);
    if (result.error) return result.error;

    const { supabase, company } = result;
    const state = cancellationState(company);

    if (!state.scheduled || !company.paddle_subscription_id) {
      return Response.json({ error: "This subscription is not scheduled to cancel." }, { status: 409 });
    }

    const paddleSubscription = await removePaddleSubscriptionCancellation(company.paddle_subscription_id);
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        cancellation_scheduled_at: null,
        cancellation_effective_at: null,
        cancellation_withdrawn_at: new Date().toISOString(),
      })
      .eq("id", company.id);

    if (updateError) {
      throw updateError;
    }

    return Response.json({
      scheduled: false,
      effectiveAt: null,
      subscriptionStatus: paddleSubscription.status ?? company.subscription_status,
    });
  } catch (error) {
    console.error("Could not remove subscription cancellation", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not keep this subscription active." },
      { status: 500 },
    );
  }
}
