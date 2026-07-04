import { createClient } from "@supabase/supabase-js";
import { sendTrialStartedEmail } from "@/src/lib/email";

const trialLengthsMs = {
  Pro: 3 * 24 * 60 * 60 * 1000,
  Ultra: 7 * 24 * 60 * 60 * 1000,
};

type TrialPlan = keyof typeof trialLengthsMs;

function normalizeTrialPlan(plan: unknown): TrialPlan {
  return plan === "Ultra" ? "Ultra" : "Pro";
}

function trialErrorResponse(error: unknown, fallback: string) {
  console.error(fallback, error);

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.includes("trial_")
  ) {
    return Response.json(
      { error: "Trial database fields are missing. Apply the Supabase billing migration." },
      { status: 500 },
    );
  }

  return Response.json({ error: fallback }, { status: 500 });
}

async function getSessionCompany(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      error: Response.json({ error: "Supabase is not configured." }, { status: 500 }),
    };
  }

  if (!token) {
    return {
      error: Response.json({ error: "You must be signed in to start a trial." }, { status: 401 }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();

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
      .select("plan, trial_started_at, trial_ends_at")
      .eq("id", companyId)
      .single();

    if (companyError) {
      throw companyError;
    }

    return Response.json({
      used: Boolean(company?.trial_started_at || company?.trial_ends_at),
      plan: company?.plan === "ultra" ? "Ultra" : "Pro",
      startsAt: company?.trial_started_at ?? null,
      endsAt: company?.trial_ends_at ?? null,
    });
  } catch (error) {
    return trialErrorResponse(error, "Could not load trial status.");
  }
}

export async function POST(request: Request) {
  try {
    const sessionCompany = await getSessionCompany(request);

    if (sessionCompany.error) {
      return sessionCompany.error;
    }

    const { supabase, companyId } = sessionCompany;
    const body = await request.json().catch(() => ({}));
    const trialPlan = normalizeTrialPlan(body.plan);
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("name, email, trial_started_at, trial_ends_at")
      .eq("id", companyId)
      .single();

    if (companyError) {
      throw companyError;
    }

    if (company?.trial_started_at || company?.trial_ends_at) {
      return Response.json({ error: "This company has already used a trial." }, { status: 409 });
    }

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + trialLengthsMs[trialPlan]);
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        plan: trialPlan.toLowerCase(),
        subscription_status: "trialing",
        payment_provider: "trial",
        trial_started_at: startsAt.toISOString(),
        trial_ends_at: endsAt.toISOString(),
      })
      .eq("id", companyId);

    if (updateError) {
      throw updateError;
    }

    if (company?.email) {
      await sendTrialStartedEmail({
        to: company.email,
        companyName: company.name ?? "your company",
        plan: trialPlan,
        trialEndDate: endsAt.toISOString(),
      });
    }

    return Response.json({
      plan: trialPlan,
      subscriptionStatus: "trialing",
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
  } catch (error) {
    return trialErrorResponse(error, "Could not start the trial.");
  }
}
