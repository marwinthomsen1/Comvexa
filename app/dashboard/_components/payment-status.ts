const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
const selectedPlanKey = "comvexa-selected-plan";
const selectedBillingCycleKey = "comvexa-billing-cycle";
const pendingPlanKey = "comvexa-pending-plan";
const pendingBillingCycleKey = "comvexa-pending-billing-cycle";
const paymentCompleteKey = "comvexa-payment-complete";
const paymentProviderKey = "comvexa-payment-provider";
const paymentConfirmedAtKey = "comvexa-payment-confirmed-at";

export type BillingCycle = "monthly" | "yearly";

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
}

export type TrialStatus = {
  used: boolean;
  active: boolean;
  expired: boolean;
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
      startsAt: null,
      endsAt: null,
      remainingMs: 0,
    };
  }

  const used = window.localStorage.getItem("comvexa-pro-trial-used") === "true";
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
  const endsAt = startsAt + threeDaysMs;

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

export function isWorkspaceAccessActive() {
  return isPaymentSetupComplete() || getProTrialStatus().active;
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
