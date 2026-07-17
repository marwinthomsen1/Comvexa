"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { getCachedSubscriptionAccess, invalidateSubscriptionAccess, loadSubscriptionAccess, type SubscriptionAccess } from "./subscription-access";

export function PaymentGate({ children }: { children: React.ReactNode }) {
  const cachedAccess = getCachedSubscriptionAccess();
  const [accessActive, setAccessActive] = useState(cachedAccess?.accessActive ?? false);
  const [trialExpired, setTrialExpired] = useState(cachedAccess?.trialExpired ?? false);

  useEffect(() => {
    function applyAccess(access: SubscriptionAccess) {
      setAccessActive(access.accessActive);
      setTrialExpired(access.trialExpired);
    }

    async function loadPaymentStatus() {
      applyAccess(await loadSubscriptionAccess());
    }

    function syncPaymentStatus(event: Event) {
      const access = (event as CustomEvent<SubscriptionAccess>).detail;
      if (access) {
        applyAccess(access);
      }
    }

    const timeout = window.setTimeout(() => void loadPaymentStatus(), 0);
    function refreshPaymentStatus() {
      invalidateSubscriptionAccess();
      void loadPaymentStatus();
    }
    window.addEventListener("storage", loadPaymentStatus);
    window.addEventListener("comvexa-plan-change", refreshPaymentStatus);
    window.addEventListener("comvexa-subscription-sync", syncPaymentStatus);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("storage", loadPaymentStatus);
      window.removeEventListener("comvexa-plan-change", refreshPaymentStatus);
      window.removeEventListener("comvexa-subscription-sync", syncPaymentStatus);
    };
  }, []);

  if (accessActive) {
    return children;
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 p-6">
      <section className="dashboard-gate rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/70">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
          <LockKeyhole size={24} />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-normal text-slate-950">
          {trialExpired ? "Your Pro trial has ended" : "Choose a plan to open your dashboard"}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          {trialExpired
            ? "Your 3-day Pro trial can only be used once. Continue to payment to keep using Comvexa."
            : "Start the one-time 3-day Pro trial or choose a paid plan before accessing Comvexa modules."}
        </p>
        <Link
          href={trialExpired ? "/dashboard/subscription/payment" : "/dashboard/subscription"}
          className="mt-6 inline-flex rounded-full bg-[var(--comvexa-action,#073d47)] px-6 py-3 text-sm font-bold text-white hover:opacity-90"
        >
          {trialExpired ? "Go to payment" : "Choose plan"}
        </Link>
      </section>
    </main>
  );
}
