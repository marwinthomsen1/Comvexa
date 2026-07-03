import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

const trialLengthMs = 3 * 24 * 60 * 60 * 1000;

async function getSessionCompany(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!token) {
    return {
      error: Response.json({ error: "You must be signed in to start a trial." }, { status: 401 }),
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    return {
      error: Response.json({ error: "Invalid session." }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile?.company_id) {
    return {
      error: Response.json({ error: "Your profile is not connected to a company." }, { status: 400 }),
    };
  }

  return {
    supabase,
    companyId: profile.company_id as string,
  };
}

export async function GET(request: Request) {
  try {
    const sessionCompany = await getSessionCompany(request);

    if (sessionCompany.error) {
      return sessionCompany.error;
    }

    const { supabase, companyId } = sessionCompany;
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("trial_started_at, trial_ends_at")
      .eq("id", companyId)
      .single();

    if (companyError) {
      throw companyError;
    }

    return Response.json({
      used: Boolean(company?.trial_started_at || company?.trial_ends_at),
      startsAt: company?.trial_started_at ?? null,
      endsAt: company?.trial_ends_at ?? null,
    });
  } catch {
    return Response.json({ error: "Could not load trial status." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionCompany = await getSessionCompany(request);

    if (sessionCompany.error) {
      return sessionCompany.error;
    }

    const { supabase, companyId } = sessionCompany;
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("trial_started_at, trial_ends_at")
      .eq("id", companyId)
      .single();

    if (companyError) {
      throw companyError;
    }

    if (company?.trial_started_at || company?.trial_ends_at) {
      return Response.json({ error: "This company has already used the Pro trial." }, { status: 409 });
    }

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + trialLengthMs);
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        plan: "pro",
        subscription_status: "trialing",
        payment_provider: "trial",
        trial_started_at: startsAt.toISOString(),
        trial_ends_at: endsAt.toISOString(),
      })
      .eq("id", companyId);

    if (updateError) {
      throw updateError;
    }

    return Response.json({
      plan: "Pro",
      subscriptionStatus: "trialing",
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
  } catch {
    return Response.json({ error: "Could not start the Pro trial." }, { status: 500 });
  }
}
