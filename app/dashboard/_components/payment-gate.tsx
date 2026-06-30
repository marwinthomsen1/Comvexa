"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { isPaymentSetupComplete } from "./payment-status";

export function PaymentGate({ children }: { children: React.ReactNode }) {
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    function loadPaymentStatus() {
      setPaymentComplete(isPaymentSetupComplete());
    }

    const timeout = window.setTimeout(loadPaymentStatus, 0);
    window.addEventListener("storage", loadPaymentStatus);
    window.addEventListener("comvexa-plan-change", loadPaymentStatus);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("storage", loadPaymentStatus);
      window.removeEventListener("comvexa-plan-change", loadPaymentStatus);
    };
  }, []);

  if (paymentComplete) {
    return children;
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/70">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
          <LockKeyhole size={24} />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-normal text-slate-950">
          Complete setup to open your dashboard
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          Choose a plan and complete payment setup before accessing Comvexa modules.
        </p>
        <Link
          href="/dashboard/subscription"
          className="mt-6 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Choose plan
        </Link>
      </section>
    </main>
  );
}
