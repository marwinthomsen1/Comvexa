import { hasOwnerDashboardAccess } from "@/src/lib/admin/access";
import { supabase } from "@/src/lib/supabase/client";
import { normalizePlan, type PlanName } from "./plan-access";

export type SubscriptionAccess = {
  plan: PlanName;
  accessActive: boolean;
  trialActive: boolean;
  trialExpired: boolean;
  trialEndsAt: string | null;
};

const inactiveAccess: SubscriptionAccess = {
  plan: "Basic",
  accessActive: false,
  trialActive: false,
  trialExpired: false,
  trialEndsAt: null,
};

type CompanySubscription = {
  plan: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
};

const accessCache = new Map<string, { value: SubscriptionAccess; expiresAt: number }>();
const pendingAccess = new Map<string, Promise<SubscriptionAccess>>();
let latestAccess: SubscriptionAccess | null = null;

export function getCachedSubscriptionAccess() {
  return latestAccess;
}

export function invalidateSubscriptionAccess() {
  latestAccess = null;
  accessCache.clear();
  pendingAccess.clear();
}

function rememberAccess(access: SubscriptionAccess) {
  latestAccess = access;
  return access;
}

async function getSessionWithTimeout() {
  let timeoutId: number | undefined;

  try {
    return await Promise.race([
      supabase.auth.getSession(),
      new Promise<null>((resolve) => {
        timeoutId = window.setTimeout(() => resolve(null), 4_000);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
}

async function loadCompanyAccess(userId: string): Promise<SubscriptionAccess> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4_000);

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("company:companies(plan, subscription_status, trial_ends_at)")
      .eq("id", userId)
      .abortSignal(controller.signal)
      .single();

    if (error || !data?.company) {
      return inactiveAccess;
    }

    const relatedCompany = data.company as CompanySubscription | CompanySubscription[];
    const company = Array.isArray(relatedCompany) ? relatedCompany[0] : relatedCompany;

    if (!company) {
      return inactiveAccess;
    }

    const trialEndsAtMs = company.trial_ends_at ? new Date(company.trial_ends_at).getTime() : 0;
    const trialActive = company.subscription_status === "trialing" && trialEndsAtMs > Date.now();

    return {
      plan: normalizePlan(company.plan),
      accessActive: company.subscription_status === "active" || trialActive,
      trialActive,
      trialExpired:
        company.subscription_status === "trial_expired" ||
        (Boolean(trialEndsAtMs) && trialEndsAtMs <= Date.now()),
      trialEndsAt: company.trial_ends_at,
    };
  } catch {
    return inactiveAccess;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function loadSubscriptionAccess(): Promise<SubscriptionAccess> {
  const sessionResult = await getSessionWithTimeout();
  const session = sessionResult?.data.session;

  if (!session) {
    return rememberAccess(inactiveAccess);
  }

  if (hasOwnerDashboardAccess(session.user.email)) {
    return rememberAccess({
      plan: normalizePlan(window.localStorage.getItem("comvexa-selected-plan") ?? "Ultra"),
      accessActive: true,
      trialActive: false,
      trialExpired: false,
      trialEndsAt: null,
    });
  }

  const cached = accessCache.get(session.user.id);
  if (cached && cached.expiresAt > Date.now()) {
    return rememberAccess(cached.value);
  }

  const existingRequest = pendingAccess.get(session.user.id);
  if (existingRequest) {
    return existingRequest;
  }

  const request = loadCompanyAccess(session.user.id).then((access) => {
    accessCache.set(session.user.id, { value: access, expiresAt: Date.now() + 5 * 60_000 });
    return rememberAccess(access);
  }).finally(() => {
    pendingAccess.delete(session.user.id);
  });

  pendingAccess.set(session.user.id, request);
  return request;
}
