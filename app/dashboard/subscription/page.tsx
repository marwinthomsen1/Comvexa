"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ReceiptText } from "lucide-react";
import {
  formatTrialRemaining,
  getPendingPaidPlan,
  getProTrialStatus,
  setPendingPaidPlan,
  startProTrial,
  type TrialStatus,
} from "../_components/payment-status";
import { CurrencySelector, CurrencyValue, formatCurrencyAmount, useSelectedCurrency } from "../../_components/currency-display";

const plans = [
  {
    name: "Basic",
    price: 29,
    description: "For small teams starting with essential company management.",
    features: [
      "Dashboard",
      "Customers",
      "Services/products",
      "Tasks",
      "Invoices",
      "Payment status",
      "Basic expense records",
      "Customer balances",
      "Simple tax fields",
      "Income summary",
      "Basic reports",
    ],
  },
  {
    name: "Pro",
    price: 79,
    description: "For growing companies that need staff, bookings, and richer operations.",
    features: [
      "Everything in Basic",
      "Employee management",
      "Bookings",
      "Payment reminders",
      "Recurring invoices",
      "Partial payments",
      "Expense categories",
      "Accounts receivable aging",
      "Tax summary report",
      "Profit and loss summary",
      "Documents",
      "Advanced reports",
      "CSV exports",
    ],
  },
  {
    name: "Ultra",
    price: 149,
    description: "For companies that need branches, inventory, permissions, and advanced analytics.",
    features: [
      "Everything in Pro",
      "Multiple branches",
      "Inventory",
      "Supplier management",
      "Advanced permissions",
      "Cash flow overview",
      "Advanced expense management",
      "Supplier bills tracking",
      "Payment reconciliation",
      "Multi-currency records",
      "Branch-level financial reports",
      "Custom tax settings",
      "Accountant-ready exports",
      "Priority support",
    ],
  },
];

function getYearlyTotal(monthlyPrice: number) {
  return monthlyPrice * 10;
}

function getEffectiveMonthly(monthlyPrice: number) {
  return getYearlyTotal(monthlyPrice) / 12;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const currency = useSelectedCurrency();
  const [selectedPlan, setSelectedPlan] = useState("Pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    used: false,
    active: false,
    expired: false,
    startsAt: null,
    endsAt: null,
    remainingMs: 0,
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const pending = getPendingPaidPlan();
      const storedPlan = pending.plan ?? window.localStorage.getItem("comvexa-selected-plan");
      const storedCycle = pending.billingCycle ?? window.localStorage.getItem("comvexa-billing-cycle");

      if (storedPlan) {
        setSelectedPlan(storedPlan);
      }

      if (storedCycle === "monthly" || storedCycle === "yearly") {
        setBillingCycle(storedCycle);
      }

      setTrialStatus(getProTrialStatus());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const plan = useMemo(
    () => plans.find((item) => item.name === selectedPlan) ?? plans[1],
    [selectedPlan],
  );

  const subtotal = billingCycle === "yearly" ? getYearlyTotal(plan.price) : plan.price;
  const proTrialAvailable = selectedPlan === "Pro" && !trialStatus.used;
  const proTrialActive = selectedPlan === "Pro" && trialStatus.active;
  const proTrialExpired = selectedPlan === "Pro" && trialStatus.expired;
  const trialText =
    selectedPlan !== "Pro"
      ? "No free trial on this plan"
      : proTrialActive
        ? formatTrialRemaining(trialStatus.remainingMs)
        : proTrialExpired
          ? "Trial already used"
          : "One-time 3-day free trial available";
  const dueNow = selectedPlan === "Pro" && (proTrialAvailable || proTrialActive) ? 0 : subtotal;

  function continueToPayment() {
    if (selectedPlan === "Pro" && !trialStatus.used) {
      startProTrial();
      window.dispatchEvent(new Event("comvexa-plan-change"));
      router.push("/dashboard");
      return;
    }

    if (selectedPlan === "Pro" && trialStatus.active) {
      window.dispatchEvent(new Event("comvexa-plan-change"));
      router.push("/dashboard");
      return;
    }

    setPendingPaidPlan(selectedPlan, billingCycle);
    router.push("/dashboard/subscription/payment");
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Step 1 of 2
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">Choose your plan</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Sign up first, choose the right Comvexa plan, then continue to the
              payment page. The free trial is only available on Pro, lasts 3 days,
              and can only be used once. You pay after the timer ends, not at the beginning.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100" data-no-translate>
            {selectedPlan}: {trialText}
          </div>
        </div>

        <div className="mt-6 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          {(["monthly", "yearly"] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setBillingCycle(cycle)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${
                billingCycle === cycle ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
              }`}
            >
              {cycle}
              {cycle === "yearly" ? " - 2 months free" : ""}
            </button>
          ))}
        </div>
        <div className="mt-4 flex max-w-xs items-center gap-3">
          <span className="text-sm font-semibold text-slate-600">Currency</span>
          <CurrencySelector tone="light" compact />
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((item) => {
            const isSelected = item.name === selectedPlan;

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setSelectedPlan(item.name)}
                className={`rounded-3xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                  isSelected ? "border-emerald-500 ring-4 ring-emerald-100" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950">{item.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                  {isSelected ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800" data-no-translate>
                      Selected
                    </span>
                  ) : null}
                </div>
                {billingCycle === "yearly" ? (
                  <div className="mt-7">
                    <p className="text-4xl font-semibold tracking-normal text-slate-950">
                      <CurrencyValue usd={getYearlyTotal(item.price)} currency={currency} />
                      <span className="text-base font-medium text-slate-500">/year</span>
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      <CurrencyValue usd={getEffectiveMonthly(item.price)} currency={currency} />/month effective
                    </p>
                  </div>
                ) : (
                  <p className="mt-7 text-4xl font-semibold tracking-normal text-slate-950">
                    <CurrencyValue usd={item.price} currency={currency} />
                    <span className="text-base font-medium text-slate-500">/month</span>
                  </p>
                )}
                <p className={`mt-2 text-sm font-semibold ${item.name === "Pro" ? "text-emerald-700" : "text-slate-500"}`} data-no-translate>
                  {item.name === "Pro" ? "Includes a 3-day free trial." : "No free trial on this plan."}
                </p>
                <div className={`mt-7 rounded-xl px-5 py-3 text-center text-sm font-semibold ${
                  isSelected ? "bg-emerald-600 text-white" : "bg-slate-950 text-white"
                }`} data-no-translate>
                  {isSelected ? "Plan selected" : "Choose plan"}
                </div>
                <ul className="mt-7 max-h-72 space-y-3 overflow-y-auto pr-2 text-sm text-slate-600 [scrollbar-width:thin]">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <Check className="mt-0.5 text-emerald-600" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ReceiptText size={20} />
            </span>
            <div>
              <h3 className="font-semibold text-slate-950">Plan summary</h3>
              <p className="text-sm text-slate-500">{billingCycle} billing</p>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500" data-no-translate>{plan.name} plan</span>
              <span className="font-semibold text-slate-950">
                <CurrencyValue usd={subtotal} currency={currency} />
              </span>
            </div>
            {billingCycle === "yearly" ? (
              <div className="flex justify-between">
                <span className="text-slate-500">Effective monthly</span>
                <span className="font-semibold text-slate-950">
                  <CurrencyValue usd={getEffectiveMonthly(plan.price)} currency={currency} />
                </span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-slate-500">Trial</span>
              <span className="font-semibold text-slate-950" data-no-translate>
                {selectedPlan === "Pro" ? "3 days" : "None"}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-950" data-no-translate>
                  {dueNow === 0 ? "Due today" : "Due on payment page"}
                </span>
                <span className="text-2xl font-semibold text-slate-950">
                  <CurrencyValue usd={dueNow} currency={currency} />
                </span>
              </div>
              {selectedPlan === "Pro" ? (
                <p className="mt-2 text-xs leading-5 text-slate-500" data-no-translate>
                  {proTrialAvailable
                    ? `After 3 days, ${billingCycle === "yearly" ? `${formatCurrencyAmount(subtotal, currency)}/year` : `${formatCurrencyAmount(plan.price, currency)}/month`} is due.`
                    : proTrialActive
                      ? `Payment is due when the trial ends: ${formatTrialRemaining(trialStatus.remainingMs)}.`
                      : "The Pro trial was already used once. Payment is required to continue."}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={continueToPayment}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            data-no-translate
          >
            {selectedPlan === "Pro" && proTrialAvailable
              ? "Start 3-day trial"
              : selectedPlan === "Pro" && proTrialActive
                ? "Open dashboard"
                : "Continue to payment"}
            <ArrowRight size={16} />
          </button>
        </aside>
      </section>
    </main>
  );
}
