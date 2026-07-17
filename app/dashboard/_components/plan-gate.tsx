"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { canUseModule, defaultPlan, type PlanName } from "./plan-access";
import { getCachedSubscriptionAccess, invalidateSubscriptionAccess, loadSubscriptionAccess, type SubscriptionAccess } from "./subscription-access";

const alwaysVisibleModules = ["Dashboard", "Subscription", "Settings"];

function readWorkspaceModules() {
  try {
    const saved = window.localStorage.getItem("comvexa-workspace-settings");
    const settings = saved ? JSON.parse(saved) : null;
    return Array.isArray(settings?.modules) ? (settings.modules as string[]) : null;
  } catch {
    return null;
  }
}

export function PlanGate({
  moduleName,
  children,
}: {
  moduleName: string;
  children: React.ReactNode;
}) {
  const cachedAccess = getCachedSubscriptionAccess();
  const [plan, setPlan] = useState<PlanName>(cachedAccess?.plan ?? defaultPlan);
  const [accessActive, setAccessActive] = useState(cachedAccess?.accessActive ?? false);
  const [trialExpired, setTrialExpired] = useState(cachedAccess?.trialExpired ?? false);
  const [moduleVisible, setModuleVisible] = useState(true);

  useEffect(() => {
    function applyAccess(access: SubscriptionAccess) {
      setPlan(access.plan);
      setAccessActive(access.accessActive);
      setTrialExpired(access.trialExpired);
      const visibleModules = readWorkspaceModules();
      setModuleVisible(
        alwaysVisibleModules.includes(moduleName) ||
          !visibleModules ||
          visibleModules.includes(moduleName),
      );
    }

    async function loadPlan() {
      applyAccess(await loadSubscriptionAccess());
    }

    function syncPlan(event: Event) {
      const access = (event as CustomEvent<SubscriptionAccess>).detail;
      if (access) {
        applyAccess(access);
      }
    }

    const timeout = window.setTimeout(() => void loadPlan(), 0);
    function refreshPlan() {
      invalidateSubscriptionAccess();
      void loadPlan();
    }
    window.addEventListener("storage", loadPlan);
    window.addEventListener("comvexa-plan-change", refreshPlan);
    window.addEventListener("comvexa-settings-change", loadPlan);
    window.addEventListener("comvexa-subscription-sync", syncPlan);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("storage", loadPlan);
      window.removeEventListener("comvexa-plan-change", refreshPlan);
      window.removeEventListener("comvexa-settings-change", loadPlan);
      window.removeEventListener("comvexa-subscription-sync", syncPlan);
    };
  }, [moduleName]);

  if (accessActive && moduleVisible && canUseModule(plan, moduleName)) {
    return children;
  }

  const hiddenBySettings = accessActive && !moduleVisible;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 p-6">
      <section className="dashboard-gate rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/70">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
          <LockKeyhole size={24} />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-normal text-slate-950">
          {hiddenBySettings
            ? `${moduleName} is hidden in workspace settings`
            : !accessActive
            ? trialExpired
              ? "Your Pro trial has ended"
              : "Choose a plan first"
            : `${moduleName} is not included in ${plan}`}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          {hiddenBySettings
            ? "Turn this module back on from Module Visibility before your team can use it."
            : !accessActive
            ? trialExpired
              ? "Your 3-day Pro trial can only be used once. Continue to payment to keep using this workspace."
              : "Start the one-time 3-day Pro trial or choose a paid plan before using Comvexa modules."
            : "Upgrade your Comvexa subscription to unlock this module for your company workspace."}
        </p>
        <Link
          href={hiddenBySettings ? "/dashboard/settings" : trialExpired ? "/dashboard/subscription/payment" : "/dashboard/subscription"}
          className="mt-6 inline-flex rounded-full bg-[var(--comvexa-action,#073d47)] px-6 py-3 text-sm font-bold text-white hover:opacity-90"
        >
          {hiddenBySettings ? "Open settings" : trialExpired ? "Go to payment" : "View plans"}
        </Link>
      </section>
    </main>
  );
}
