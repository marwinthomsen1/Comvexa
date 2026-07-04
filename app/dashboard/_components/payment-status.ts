const trialLengthsMs: Record<PaidPlanName, number> = {
  Basic: 0,
  Pro: 3 * 24 * 60 * 60 * 1000,
  Ultra: 7 * 24 * 60 * 60 * 1000,
};
const selectedPlanKey = "comvexa-selected-plan";
const selectedBillingCycleKey = "comvexa-billing-cycle";
const pendingPlanKey = "comvexa-pending-plan";
const pendingBillingCycleKey = "comvexa-pending-billing-cycle";
const paymentCompleteKey = "comvexa-payment-complete";
const paymentProviderKey = "comvexa-payment-provider";
const paymentConfirmedAtKey = "comvexa-payment-confirmed-at";
const ownerPlanAccessKey = "comvexa-owner-plan-access";
const ownerPlanAccessEmailKey = "comvexa-owner-plan-access-email";
const firstPlanUnlockedEvent = "comvexa-first-plan-unlocked";

export type BillingCycle = "monthly" | "yearly";
export type PaidPlanName = "Basic" | "Pro" | "Ultra";

function normalizePaidPlan(plan: string | null): PaidPlanName {
  if (plan === "Basic" || plan === "Pro" || plan === "Ultra") {
    return plan;
  }

  return "Ultra";
}

export function isPaymentSetupComplete() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(paymentCompleteKey) === "true" &&
    window.localStorage.getItem(paymentProviderKey) === "paddle" &&
    Boolean(window.localStorage.getItem(paymentConfirmedAtKey))
  );
}

export function isOwnerPlanAccessActive() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(ownerPlanAccessKey) === "true";
}

export function isOwnerPlanAccessActiveFor(email?: string | null) {
  if (typeof window === "undefined") {
    return false;
  }

  const savedEmail = window.localStorage.getItem(ownerPlanAccessEmailKey);

  if (!savedEmail) {
    return isOwnerPlanAccessActive();
  }

  return email ? savedEmail === email.trim().toLowerCase() : false;
}

export function getOwnerPlanAccessEmail() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ownerPlanAccessEmailKey);
}

export function enableOwnerPlanAccess(
  plan: string | null,
  billingCycle: BillingCycle = "monthly",
  email?: string | null,
) {
  if (typeof window === "undefined") {
    return;
  }

  const nextPlan = normalizePaidPlan(plan);
  const alreadyEnabled = window.localStorage.getItem(ownerPlanAccessKey) === "true";
  const currentPlan = window.localStorage.getItem(selectedPlanKey);
  const currentBillingCycle = window.localStorage.getItem(selectedBillingCycleKey);

  window.localStorage.setItem(ownerPlanAccessKey, "true");
  if (email) {
    window.localStorage.setItem(ownerPlanAccessEmailKey, email.trim().toLowerCase());
  }
  window.localStorage.setItem(selectedPlanKey, nextPlan);
  window.localStorage.setItem(selectedBillingCycleKey, billingCycle);
  window.localStorage.removeItem(pendingPlanKey);
  window.localStorage.removeItem(pendingBillingCycleKey);

  if (!alreadyEnabled || currentPlan !== nextPlan || currentBillingCycle !== billingCycle) {
    window.dispatchEvent(new Event("comvexa-plan-change"));
    window.dispatchEvent(new Event(firstPlanUnlockedEvent));
  }
}

export function setPendingPaidPlan(plan: string, billingCycle: BillingCycle) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(pendingPlanKey, plan);
  window.localStorage.setItem(pendingBillingCycleKey, billingCycle);
}

export function getPendingPaidPlan() {
  if (typeof window === "undefined") {
    return {
      plan: null,
      billingCycle: null,
    };
  }

  const billingCycle = window.localStorage.getItem(pendingBillingCycleKey);

  return {
    plan: window.localStorage.getItem(pendingPlanKey),
    billingCycle: billingCycle === "monthly" || billingCycle === "yearly" ? billingCycle : null,
  };
}

export function activatePaidPlanFromPending() {
  if (typeof window === "undefined") {
    return;
  }

  const pending = getPendingPaidPlan();

  if (pending.plan) {
    window.localStorage.setItem(selectedPlanKey, pending.plan);
  }

  if (pending.billingCycle) {
    window.localStorage.setItem(selectedBillingCycleKey, pending.billingCycle);
  }

  window.localStorage.setItem(paymentCompleteKey, "true");
  window.localStorage.setItem(paymentProviderKey, "paddle");
  window.localStorage.setItem(paymentConfirmedAtKey, new Date().toISOString());
  window.localStorage.removeItem(pendingPlanKey);
  window.localStorage.removeItem(pendingBillingCycleKey);
  window.dispatchEvent(new Event("comvexa-plan-change"));
  window.dispatchEvent(new Event(firstPlanUnlockedEvent));
}

export type TrialStatus = {
  used: boolean;
  active: boolean;
  expired: boolean;
  plan: PaidPlanName | null;
  startsAt: number | null;
  endsAt: number | null;
  remainingMs: number;
};

export function getProTrialStatus(): TrialStatus {
  if (typeof window === "undefined") {
    return {
      used: false,
      active: false,
      expired: false,
      plan: null,
      startsAt: null,
      endsAt: null,
      remainingMs: 0,
    };
  }

  const used = window.localStorage.getItem("comvexa-pro-trial-used") === "true";
  const plan = normalizePaidPlan(window.localStorage.getItem(selectedPlanKey));
  const startsAt = Number(window.localStorage.getItem("comvexa-pro-trial-starts-at"));
  const endsAt = Number(window.localStorage.getItem("comvexa-pro-trial-ends-at"));
  const now = Date.now();
  const hasDates = Number.isFinite(startsAt) && Number.isFinite(endsAt) && endsAt > 0;
  const active = used && hasDates && now < endsAt;
  const expired = used && hasDates && now >= endsAt;

  return {
    used,
    active,
    expired,
    plan: used ? plan : null,
    startsAt: hasDates ? startsAt : null,
    endsAt: hasDates ? endsAt : null,
    remainingMs: active ? endsAt - now : 0,
  };
}

export function startProTrial() {
  if (typeof window === "undefined") {
    return getProTrialStatus();
  }

  const existing = getProTrialStatus();

  if (existing.used) {
    return existing;
  }

  const startsAt = Date.now();
  const endsAt = startsAt + trialLengthsMs.Pro;

  window.localStorage.setItem(selectedPlanKey, "Pro");
  window.localStorage.setItem(selectedBillingCycleKey, "monthly");
  window.localStorage.setItem("comvexa-pro-trial-used", "true");
  window.localStorage.setItem("comvexa-pro-trial-starts-at", String(startsAt));
  window.localStorage.setItem("comvexa-pro-trial-ends-at", String(endsAt));
  window.localStorage.setItem(paymentCompleteKey, "false");
  window.localStorage.removeItem(paymentProviderKey);
  window.localStorage.removeItem(paymentConfirmedAtKey);

  return getProTrialStatus();
}

export function activatePlanTrial(
  plan: string,
  startsAtIso: string,
  endsAtIso: string,
  options: { announceUnlock?: boolean } = {},
) {
  if (typeof window === "undefined") {
    return getProTrialStatus();
  }

  const selectedPlan = normalizePaidPlan(plan);
  const startsAt = new Date(startsAtIso).getTime();
  const endsAt = new Date(endsAtIso).getTime();

  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) {
    return getProTrialStatus();
  }

  window.localStorage.setItem(selectedPlanKey, selectedPlan);
  window.localStorage.setItem(selectedBillingCycleKey, "monthly");
  window.localStorage.setItem("comvexa-pro-trial-used", "true");
  window.localStorage.setItem("comvexa-pro-trial-starts-at", String(startsAt));
  window.localStorage.setItem("comvexa-pro-trial-ends-at", String(endsAt));
  window.localStorage.setItem(paymentCompleteKey, "false");
  window.localStorage.removeItem(paymentProviderKey);
  window.localStorage.removeItem(paymentConfirmedAtKey);
  window.dispatchEvent(new Event("comvexa-plan-change"));

  if (options.announceUnlock ?? true) {
    window.dispatchEvent(new Event(firstPlanUnlockedEvent));
  }

  return getProTrialStatus();
}

export function activateProTrial(
  startsAtIso: string,
  endsAtIso: string,
  options: { announceUnlock?: boolean } = {},
) {
  return activatePlanTrial("Pro", startsAtIso, endsAtIso, options);
}

export function clearProTrialStatus() {
  if (typeof window === "undefined") {
    return getProTrialStatus();
  }

  window.localStorage.removeItem("comvexa-pro-trial-used");
  window.localStorage.removeItem("comvexa-pro-trial-starts-at");
  window.localStorage.removeItem("comvexa-pro-trial-ends-at");

  return getProTrialStatus();
}

export function syncProTrialStatus(used: boolean, startsAtIso: string | null, endsAtIso: string | null, plan = "Pro") {
  if (!used || !startsAtIso || !endsAtIso) {
    return clearProTrialStatus();
  }

  return activatePlanTrial(plan, startsAtIso, endsAtIso, { announceUnlock: false });
}

export function isWorkspaceAccessActive() {
  return isOwnerPlanAccessActive() || isPaymentSetupComplete() || getProTrialStatus().active;
}

export function formatTrialRemaining(remainingMs: number) {
  if (remainingMs <= 0) {
    return "Trial ended";
  }

  const totalHours = Math.ceil(remainingMs / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days <= 0) {
    return `${hours} hour${hours === 1 ? "" : "s"} left`;
  }

  return `${days} day${days === 1 ? "" : "s"} ${hours} hour${hours === 1 ? "" : "s"} left`;
}
