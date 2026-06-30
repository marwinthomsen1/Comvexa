"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { canUseModule, defaultPlan, normalizePlan, type PlanName } from "./plan-access";
import { isPaymentSetupComplete } from "./payment-status";

export function PlanGate({
  moduleName,
  children,
}: {
  moduleName: string;
  children: React.ReactNode;
}) {
  const [plan, setPlan] = useState<PlanName>(defaultPlan);
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    function loadPlan() {
      setPlan(normalizePlan(window.localStorage.getItem("comvexa-selected-plan")));
      setPaymentComplete(isPaymentSetupComplete());
    }

    const timeout = window.setTimeout(loadPlan, 0);
    window.addEventListener("storage", loadPlan);
    window.addEventListener("comvexa-plan-change", loadPlan);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("storage", loadPlan);
      window.removeEventListener("comvexa-plan-change", loadPlan);
    };
  }, []);

  if (paymentComplete && canUseModule(plan, moduleName)) {
    return children;
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/70">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
          <LockKeyhole size={24} />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-normal text-slate-950">
          {!paymentComplete ? "Complete payment setup first" : `${moduleName} is not included in ${plan}`}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          {!paymentComplete
            ? "Choose a plan and complete payment setup before using paid Comvexa modules."
            : "Upgrade your Comvexa subscription to unlock this module for your company workspace."}
        </p>
        <Link
          href="/dashboard/subscription"
          className="mt-6 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          View plans
        </Link>
      </section>
    </main>
  );
}
