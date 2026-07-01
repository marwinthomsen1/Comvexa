const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

export function isPaymentSetupComplete() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem("comvexa-payment-complete") === "true";
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

  window.localStorage.setItem("comvexa-selected-plan", "Pro");
  window.localStorage.setItem("comvexa-billing-cycle", "monthly");
  window.localStorage.setItem("comvexa-pro-trial-used", "true");
  window.localStorage.setItem("comvexa-pro-trial-starts-at", String(startsAt));
  window.localStorage.setItem("comvexa-pro-trial-ends-at", String(endsAt));
  window.localStorage.setItem("comvexa-payment-complete", "false");

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
