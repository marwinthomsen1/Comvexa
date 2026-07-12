"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ReceiptText } from "lucide-react";
import { hasOwnerDashboardAccess } from "@/src/lib/admin/access";
import { supabase } from "@/src/lib/supabase/client";
import {
  activatePlanTrial,
  enableOwnerPlanAccess,
  formatTrialRemaining,
  getPendingPaidPlan,
  getProTrialStatus,
  setPendingPaidPlan,
  syncProTrialStatus,
  type TrialStatus,
} from "../_components/payment-status";
import { CurrencySelector, CurrencyValue, formatCurrencyAmount, useSelectedCurrency } from "../../_components/currency-display";
import { trackMetaStartTrial } from "../../_components/meta-pixel";

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
    description: "For companies that want the full Comvexa operating system with automation and control.",
    features: [
      "Everything in Pro",
      "Multiple branches",
      "Branch profit and loss",
      "Branch performance comparison",
      "Inventory",
      "Low-stock alerts",
      "Purchase orders",
      "Inventory valuation",
      "Supplier management",
      "Custom roles and permissions",
      "Audit logs",
      "Approval workflows",
      "AI business assistant",
      "Automated invoice follow-ups",
      "Recurring task automation",
      "Customer payment portal",
      "Customer document uploads",
      "Employee performance reports",
      "Time-off and attendance tracking",
      "Cash flow overview",
      "Advanced expense management",
      "Supplier bills tracking",
      "Payment reconciliation",
      "Multi-currency records",
      "Branch-level financial reports",
      "Custom tax settings",
      "Accountant-ready exports",
      "White-label invoices",
      "Data import help",
      "Setup guidance",
      "Priority support",
    ],
  },
];

const trialDaysByPlan: Record<string, number> = {
  Pro: 3,
  Ultra: 7,
};

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
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [isCheckingTrial, setIsCheckingTrial] = useState(true);
  const [isOwnerPlanTester, setIsOwnerPlanTester] = useState(false);
  const [trialError, setTrialError] = useState("");
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    used: false,
    active: false,
    expired: false,
    plan: null,
    startsAt: null,
    endsAt: null,
    remainingMs: 0,
  });

  useEffect(() => {
    async function loadSubscriptionState() {
      const pending = getPendingPaidPlan();
      const storedPlan = pending.plan ?? window.localStorage.getItem("comvexa-selected-plan");
      const storedCycle = pending.billingCycle ?? window.localStorage.getItem("comvexa-billing-cycle");

      if (storedPlan) {
        setSelectedPlan(storedPlan);
      }

      if (storedCycle === "monthly" || storedCycle === "yearly") {
        setBillingCycle(storedCycle);
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        const ownerTesting = hasOwnerDashboardAccess(sessionData.session?.user.email);

        setIsOwnerPlanTester(ownerTesting);

        if (ownerTesting) {
          enableOwnerPlanAccess(storedPlan ?? "Ultra", storedCycle === "monthly" || storedCycle === "yearly" ? storedCycle : "monthly");
        }

        if (!accessToken) {
          setTrialStatus(getProTrialStatus());
          setIsCheckingTrial(false);
          return;
        }

        const response = await fetch("/api/subscription/trial", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const trial = await response.json();

        if (!response.ok) {
          setTrialStatus(getProTrialStatus());
          setIsCheckingTrial(false);
          return;
        }

        setTrialStatus(syncProTrialStatus(trial.used, trial.startsAt, trial.endsAt, trial.plan));
      } catch {
        setTrialStatus(getProTrialStatus());
      } finally {
        setIsCheckingTrial(false);
      }
    }

    void loadSubscriptionState();
  }, []);

  const plan = useMemo(
    () => plans.find((item) => item.name === selectedPlan) ?? plans[1],
    [selectedPlan],
  );

  const subtotal = billingCycle === "yearly" ? getYearlyTotal(plan.price) : plan.price;
  const selectedTrialDays = trialDaysByPlan[selectedPlan] ?? 0;
  const selectedPlanHasTrial = selectedTrialDays > 0;
  const selectedTrialAvailable = selectedPlanHasTrial && !trialStatus.used;
  const selectedTrialActive = selectedPlanHasTrial && trialStatus.active && trialStatus.plan === selectedPlan;
  const selectedTrialExpired = selectedPlanHasTrial && trialStatus.expired && trialStatus.plan === selectedPlan;
  const trialText =
    isOwnerPlanTester
      ? "Dashboard test access"
      : !selectedPlanHasTrial
      ? "No free trial on this plan"
      : isCheckingTrial
        ? "Checking trial eligibility..."
        : selectedTrialActive
        ? formatTrialRemaining(trialStatus.remainingMs)
        : selectedTrialExpired || trialStatus.used
          ? "Trial already used"
          : `One-time ${selectedTrialDays}-day free trial available`;
  const dueNow = selectedPlanHasTrial && (selectedTrialAvailable || selectedTrialActive) ? 0 : subtotal;

  async function startServerTrial() {
    setTrialError("");
    setIsStartingTrial(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setTrialError("Sign in before starting the trial.");
        setIsStartingTrial(false);
        return;
      }

      const response = await fetch("/api/subscription/trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const trial = await response.json();

      if (!response.ok) {
        setTrialError(trial.error ?? "Could not start the trial.");
        setTrialStatus(getProTrialStatus());
        setIsStartingTrial(false);
        return;
      }

      activatePlanTrial(trial.plan ?? selectedPlan, trial.startsAt, trial.endsAt);
      trackMetaStartTrial(trial.startsAt);
      setIsStartingTrial(false);
      router.push("/dashboard");
    } catch {
      setTrialError("Could not start the trial.");
      setIsStartingTrial(false);
    }
  }

  function continueToPayment() {
    if (isOwnerPlanTester) {
      enableOwnerPlanAccess(selectedPlan, billingCycle);
      router.push("/dashboard");
      return;
    }

    if (selectedPlanHasTrial && !trialStatus.used) {
      void startServerTrial();
      return;
    }

    if (selectedTrialActive) {
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
              {isOwnerPlanTester
                ? "Customer dashboard test access is active for this account. Choose any plan to preview the dashboard without opening payment."
                : "Sign up first, choose the right Comvexa plan, then continue to the payment page. Pro includes a 3-day trial and Ultra includes a 7-day trial. You pay after the timer ends, not at the beginning."}
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
                <p className={`mt-2 text-sm font-semibold ${trialDaysByPlan[item.name] ? "text-emerald-700" : "text-slate-500"}`} data-no-translate>
                  {trialDaysByPlan[item.name] ? `Includes a ${trialDaysByPlan[item.name]}-day free trial.` : "No free trial on this plan."}
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
                {isOwnerPlanTester ? "Bypassed" : selectedTrialDays ? `${selectedTrialDays} days` : "None"}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-950" data-no-translate>
                  {isOwnerPlanTester ? "Owner access" : dueNow === 0 ? "Due today" : "Due on payment page"}
                </span>
                <span className="text-2xl font-semibold text-slate-950">
                  <CurrencyValue usd={isOwnerPlanTester ? 0 : dueNow} currency={currency} />
                </span>
              </div>
              {selectedPlanHasTrial ? (
                <p className="mt-2 text-xs leading-5 text-slate-500" data-no-translate>
                  {selectedTrialAvailable
                    ? `After ${selectedTrialDays} days, ${billingCycle === "yearly" ? `${formatCurrencyAmount(subtotal, currency)}/year` : `${formatCurrencyAmount(plan.price, currency)}/month`} is due.`
                    : selectedTrialActive
                      ? `Payment is due when the trial ends: ${formatTrialRemaining(trialStatus.remainingMs)}.`
                      : "The trial was already used once. Payment is required to continue."}
                </p>
              ) : null}
            </div>
          </div>
          {trialError ? (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 ring-1 ring-red-100">
              {trialError}
            </p>
          ) : null}
          <button
            type="button"
            onClick={continueToPayment}
            disabled={isStartingTrial || isCheckingTrial}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            data-no-translate
          >
            {isCheckingTrial
              ? "Checking trial..."
              : isStartingTrial
              ? "Starting trial..."
              : isOwnerPlanTester
              ? `Open ${selectedPlan} dashboard`
              : selectedPlanHasTrial && selectedTrialAvailable
              ? `Start ${selectedTrialDays}-day trial`
              : selectedTrialActive
                ? "Open dashboard"
                : "Continue to payment"}
            <ArrowRight size={16} />
          </button>
        </aside>
      </section>
    </main>
  );
}
