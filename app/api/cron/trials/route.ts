import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { sendTrialEndingSoonEmail, sendTrialExpiredEmail } from "@/src/lib/email";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function planLabel(plan: string | null | undefined) {
  return plan === "ultra" ? "Ultra" : "Pro";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ success: false, error: "Unauthorized cron request." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const soonStart = new Date(in24Hours.getTime() - 30 * 60 * 1000).toISOString();
  const soonEnd = new Date(in24Hours.getTime() + 30 * 60 * 1000).toISOString();
  const nowIso = now.toISOString();

  const { data: endingSoonCompanies, error: endingSoonError } = await supabase
    .from("companies")
    .select("id, name, email, plan, trial_ends_at")
    .eq("subscription_status", "trialing")
    .gte("trial_ends_at", soonStart)
    .lte("trial_ends_at", soonEnd)
    .not("email", "is", null);

  if (endingSoonError) {
    throw endingSoonError;
  }

  const { data: expiredCompanies, error: expiredError } = await supabase
    .from("companies")
    .select("id, name, email, plan, trial_ends_at")
    .eq("subscription_status", "trialing")
    .lt("trial_ends_at", nowIso)
    .not("email", "is", null);

  if (expiredError) {
    throw expiredError;
  }

  await Promise.all((endingSoonCompanies ?? []).map((company) =>
    sendTrialEndingSoonEmail({
      to: company.email as string,
      companyName: company.name ?? "your company",
      plan: planLabel(company.plan),
      trialEndDate: company.trial_ends_at as string,
    }),
  ));

  await Promise.all((expiredCompanies ?? []).map(async (company) => {
    await sendTrialExpiredEmail({
      to: company.email as string,
      companyName: company.name ?? "your company",
      plan: planLabel(company.plan),
      trialEndDate: company.trial_ends_at as string,
    });

    await supabase
      .from("companies")
      .update({ subscription_status: "trial_expired" })
      .eq("id", company.id);
  }));

  return Response.json({
    success: true,
    endingSoon: endingSoonCompanies?.length ?? 0,
    expired: expiredCompanies?.length ?? 0,
  });
}
