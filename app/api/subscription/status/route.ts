import { requireUser } from "@/src/lib/auth/api";

export const dynamic = "force-dynamic";

function normalizePlan(plan: unknown) {
  const value = String(plan ?? "basic").toLowerCase();
  return value === "ultra" ? "Ultra" : value === "pro" ? "Pro" : "Basic";
}

export async function GET(request: Request) {
  try {
    const auth = await requireUser(request);

    if (auth.error) {
      return auth.error;
    }

    const { data: profile, error: profileError } = await auth.supabase
      .from("profiles")
      .select("company_id")
      .eq("id", auth.user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return Response.json({ error: "Your profile is not connected to a company." }, { status: 400 });
    }

    const { data: company, error: companyError } = await auth.supabase
      .from("companies")
      .select("plan, subscription_status, trial_started_at, trial_ends_at, billing_cycle")
      .eq("id", profile.company_id)
      .single();

    if (companyError || !company) {
      return Response.json({ error: "Company subscription was not found." }, { status: 404 });
    }

    const trialEndsAt = company.trial_ends_at ? new Date(company.trial_ends_at).getTime() : 0;
    const trialActive = company.subscription_status === "trialing" && trialEndsAt > Date.now();
    const paidActive = company.subscription_status === "active";

    return Response.json({
      plan: normalizePlan(company.plan),
      subscriptionStatus: company.subscription_status ?? "inactive",
      billingCycle: company.billing_cycle ?? null,
      accessActive: paidActive || trialActive,
      trialActive,
      trialExpired: company.subscription_status === "trial_expired" || (Boolean(trialEndsAt) && trialEndsAt <= Date.now()),
      trialStartsAt: company.trial_started_at ?? null,
      trialEndsAt: company.trial_ends_at ?? null,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not load subscription access." },
      { status: 500 },
    );
  }
}
