"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
import { openPaddleCheckout } from "@/src/lib/paddle/browser-checkout";
import {
  activatePaidPlanFromPending,
  getPendingPaidPlan,
  getProTrialStatus,
  setPendingPaidPlan,
} from "../../_components/payment-status";
import { CurrencySelector, CurrencyValue, useSelectedCurrency } from "../../../_components/currency-display";

const planPrices: Record<string, number> = {
  Basic: 29,
  Pro: 79,
  Ultra: 149,
};

export default function PaymentPage() {
  const router = useRouter();
  const currency = useSelectedCurrency();
  const [selectedPlan, setSelectedPlan] = useState("Pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const pending = getPendingPaidPlan();
      setSelectedPlan(pending.plan ?? "Pro");
      const storedCycle = pending.billingCycle;
      const trial = getProTrialStatus();

      if (trial.active && window.localStorage.getItem("comvexa-selected-plan") === "Pro") {
        router.push("/dashboard");
        return;
      }

      if (storedCycle === "monthly" || storedCycle === "yearly") {
        setBillingCycle(storedCycle);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [router]);

  const monthlyPrice = planPrices[selectedPlan] ?? 79;
  const total = useMemo(
    () => (billingCycle === "yearly" ? monthlyPrice * 10 : monthlyPrice),
    [billingCycle, monthlyPrice],
  );

  async function savePaymentSetup() {
    setError("");
    setSaved(true);
    setPendingPaidPlan(selectedPlan, billingCycle);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch("/api/paddle/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: selectedPlan,
          billingCycle,
          email: sessionData.session?.user.email,
          userId: sessionData.session?.user.id,
        }),
      });
      const checkout = await response.json();

      if (!response.ok || !checkout.transactionId) {
        setSaved(false);
        setError(checkout.error ?? "Could not open Paddle checkout.");
        return;
      }

      await openPaddleCheckout(checkout.transactionId, checkout.url, (event) => {
        if (event.name === "checkout.completed") {
          activatePaidPlanFromPending();
        }
      });
      setSaved(false);
    } catch (checkoutError) {
      setSaved(false);
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Could not open Paddle checkout.",
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Step 2 of 2
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">Payment setup</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Review your selected Comvexa plan, then continue to Paddle to
          enter payment details securely.
        </p>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <LockKeyhole size={20} />
            </span>
            <div>
              <h3 className="font-semibold text-slate-950">Secure Paddle checkout</h3>
              <p className="text-sm text-slate-500">Card and billing details are collected by Paddle.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["One checkout", "You will enter payment details only once on Paddle."],
              ["Secure billing", "Comvexa does not store card numbers or CVC codes."],
              ["Plan access", "After checkout, Comvexa opens the dashboard for this plan."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <ShieldCheck className="text-emerald-700" size={22} />
                <p className="mt-3 text-sm font-semibold text-slate-950">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 ring-1 ring-amber-100">
            The next button opens Paddle. Complete the checkout there,
            then you will return to Comvexa.
          </p>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-950">Order summary</h3>
            <CurrencySelector tone="light" compact />
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Plan</span>
              <span className="font-semibold text-slate-950">{selectedPlan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Billing</span>
              <span className="font-semibold capitalize text-slate-950">{billingCycle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Free trial</span>
              <span className="font-semibold text-slate-950">
                {selectedPlan === "Pro" ? "Used or not available now" : "None"}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-950">Due now</span>
                <span className="text-2xl font-semibold text-slate-950">
                  <CurrencyValue usd={total} currency={currency} />
                </span>
              </div>
            </div>
          </div>
          {error ? (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 ring-1 ring-red-100">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={savePaymentSetup}
            disabled={saved}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <CheckCircle2 size={17} />
            {saved ? "Opening Paddle..." : "Continue to Paddle"}
          </button>
          <Link
            href="/dashboard/subscription"
            className="mt-3 flex w-full justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to plans
          </Link>
        </aside>
      </section>
    </main>
  );
}
