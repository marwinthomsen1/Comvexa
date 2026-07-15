"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeDollarSign, CalendarClock, Check, Crown, Layers3, ReceiptText, ShieldCheck, Sparkles, Zap } from "lucide-react";
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
import { CancelSubscriptionCard } from "./cancel-subscription-card";
import { comvexaPrices, getEffectiveMonthlyPrice } from "@/src/lib/pricing";

const plans = [
  {
    name: "Basic",
    monthlyPrice: comvexaPrices.Basic.monthly,
    yearlyPrice: comvexaPrices.Basic.yearly,
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
    monthlyPrice: comvexaPrices.Pro.monthly,
    yearlyPrice: comvexaPrices.Pro.yearly,
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
    monthlyPrice: comvexaPrices.Ultra.monthly,
    yearlyPrice: comvexaPrices.Ultra.yearly,
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

  const subtotal = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
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
    <main className="plan-configurator-page mx-auto w-full max-w-[1450px] flex-1 p-4 sm:p-6">
      <section className="dashboard-custom-hero plan-config-header rounded-[2rem] border border-[#d8d7f0] bg-[#f5f4ff] p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div><div className="flex items-center gap-2 text-[#5b55c5]"><Sparkles size={17} /><p className="text-xs font-bold uppercase tracking-[0.18em]">Plan configurator · Step 1 of 2</p></div><h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#1f2140]">Build the right Comvexa workspace</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#676984]">Choose the operating level that fits your team today. You can change plans later as the company grows.</p></div>
          {isOwnerPlanTester ? <div className="inline-flex items-center gap-3 rounded-2xl bg-[#1f2140] px-4 py-3 text-sm font-semibold text-white"><ShieldCheck size={18} className="text-[#a9e8d3]" /><div><p>Owner preview access</p><p className="mt-0.5 text-[10px] font-normal text-[#b9bbd0]">Payment is bypassed for testing</p></div></div> : null}
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-[#deddf1] pt-5 sm:flex-row sm:items-center sm:justify-between"><div className="inline-flex w-fit rounded-xl bg-[#e9e8f8] p-1">{(["monthly", "yearly"] as const).map((cycle) => <button key={cycle} type="button" onClick={() => setBillingCycle(cycle)} aria-pressed={billingCycle === cycle} className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize ${billingCycle === cycle ? "bg-white text-[#292b55] shadow-sm" : "text-[#767795]"}`}>{cycle}{cycle === "yearly" ? " · best value" : ""}</button>)}</div><div className="flex items-center gap-3"><span className="text-xs font-semibold text-[#74758f]">Display currency</span><CurrencySelector tone="light" compact /></div></div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="plan-ladder overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5b55c5]">Choose your operating level</p><p className="mt-1 text-sm text-slate-500">Select a tier to see exactly what your workspace includes.</p></div>
            <div className="divide-y divide-slate-200">{plans.map((item) => {
              const isSelected = item.name === selectedPlan;
              return <button key={item.name} type="button" onClick={() => setSelectedPlan(item.name)} aria-pressed={isSelected} className={`plan-option-row grid w-full gap-4 p-5 text-left transition sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-center ${isSelected ? "bg-[#f2f0ff]" : "bg-white hover:bg-slate-50"}`}>
                <span className={`grid size-12 place-items-center rounded-2xl ${isSelected ? "bg-[#5b55c5] text-white" : "bg-slate-100 text-slate-500"}`}><PlanTierGlyph plan={item.name} /></span>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-slate-950">{item.name}</h3>{item.name === "Pro" ? <span className="rounded-full bg-[#fff1cb] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#8d6500]">Popular</span> : null}{isSelected ? <span className="rounded-full bg-[#dcd8ff] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#514ab8]">Selected</span> : null}</div><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{item.description}</p><p className={`mt-2 text-[11px] font-semibold ${trialDaysByPlan[item.name] ? "text-emerald-700" : "text-slate-400"}`}>{trialDaysByPlan[item.name] ? `${trialDaysByPlan[item.name]}-day trial included` : "Starts with paid access"}</p></div>
                <div className="sm:text-right">{billingCycle === "yearly" ? <><p className="text-2xl font-semibold text-slate-950"><CurrencyValue usd={item.yearlyPrice} currency={currency} maximumFractionDigits={2} /><span className="text-xs font-medium text-slate-500">/year</span></p><p className="mt-1 text-[10px] font-semibold text-slate-400"><CurrencyValue usd={getEffectiveMonthlyPrice(item.name)} currency={currency} maximumFractionDigits={2} /> monthly equivalent</p></> : <p className="text-2xl font-semibold text-slate-950"><CurrencyValue usd={item.monthlyPrice} currency={currency} maximumFractionDigits={2} /><span className="text-xs font-medium text-slate-500">/month</span></p>}</div>
              </button>;
            })}</div>
          </div>

          <div className="plan-toolkit mt-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5b55c5]">{plan.name} toolkit</p><h3 className="mt-1 text-xl font-semibold text-slate-950">Everything available in this workspace</h3></div><span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{plan.features.length} capabilities</span></div><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{plan.features.map((feature) => <div key={feature} className="flex items-start gap-2.5 rounded-xl bg-[#f7f7fb] px-3 py-3 text-xs text-slate-600"><Check className="mt-0.5 shrink-0 text-[#5b55c5]" size={14} /><span>{feature}</span></div>)}</div></div>
        </div>

        <aside className="plan-checkout-panel self-start overflow-hidden rounded-[2rem] bg-[#1f2140] text-white shadow-xl xl:sticky xl:top-24"><div className="border-b border-white/10 p-6"><div className="flex items-center justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[#c8c4ff]"><ReceiptText size={20} /></span><span className="rounded-full bg-[#a9e8d3] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#173b32]">{billingCycle} billing</span></div><p className="mt-6 text-xs font-semibold text-[#b8bad2]">Selected workspace</p><div className="mt-2 flex items-end justify-between gap-3"><h3 className="text-3xl font-semibold text-white">{plan.name}</h3><p className="text-xl font-semibold text-white"><CurrencyValue usd={subtotal} currency={currency} maximumFractionDigits={2} /></p></div><p className="mt-2 text-xs leading-5 text-[#b8bad2]" data-no-translate>{trialText}</p></div>
          <div className="p-6"><div className="space-y-3"><CheckoutLine icon={<CalendarClock size={15} />} label="Billing" value={billingCycle === "yearly" ? "Every year" : "Every month"} /><CheckoutLine icon={<BadgeDollarSign size={15} />} label="Trial" value={isOwnerPlanTester ? "Bypassed" : selectedTrialDays ? `${selectedTrialDays} days` : "None"} /><CheckoutLine icon={<Layers3 size={15} />} label="Capabilities" value={String(plan.features.length)} /></div><div className="mt-6 rounded-2xl bg-white/7 p-4 ring-1 ring-white/10"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-[#c9cae0]" data-no-translate>{isOwnerPlanTester ? "Owner access" : dueNow === 0 ? "Due today" : "Due on payment page"}</span><span className="text-2xl font-semibold text-white"><CurrencyValue usd={isOwnerPlanTester ? 0 : dueNow} currency={currency} maximumFractionDigits={2} /></span></div>{selectedPlanHasTrial ? <p className="mt-3 text-[10px] leading-5 text-[#aeb0c9]" data-no-translate>{selectedTrialAvailable ? `After ${selectedTrialDays} days, ${billingCycle === "yearly" ? `${formatCurrencyAmount(subtotal, currency, false, 2)}/year` : `${formatCurrencyAmount(plan.monthlyPrice, currency, false, 2)}/month`} is due.` : selectedTrialActive ? `Payment is due when the trial ends: ${formatTrialRemaining(trialStatus.remainingMs)}.` : "The trial was already used once. Payment is required to continue."}</p> : null}</div>
            {trialError ? <p className="mt-4 rounded-xl bg-red-400/10 px-4 py-3 text-xs leading-5 text-red-200 ring-1 ring-red-300/20" role="alert">{trialError}</p> : null}
            <button type="button" onClick={continueToPayment} disabled={isStartingTrial || isCheckingTrial} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#a9e8d3] px-5 text-sm font-semibold text-[#173b32] hover:bg-[#c2f1e1] disabled:opacity-60" data-no-translate>{isCheckingTrial ? "Checking trial..." : isStartingTrial ? "Starting trial..." : isOwnerPlanTester ? `Open ${selectedPlan} dashboard` : selectedPlanHasTrial && selectedTrialAvailable ? `Start ${selectedTrialDays}-day trial` : selectedTrialActive ? "Open dashboard" : "Continue to payment"}<ArrowRight size={16} /></button><div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#9295b2]"><ShieldCheck size={13} />Secure checkout and workspace access</div>
          </div>
        </aside>
      </section>

      <CancelSubscriptionCard />
    </main>
  );
}

function PlanTierGlyph({ plan }: { plan: string }) {
  if (plan === "Ultra") return <Crown size={21} />;
  if (plan === "Pro") return <Zap size={21} />;
  return <Layers3 size={21} />;
}

function CheckoutLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-3 text-xs"><span className="flex items-center gap-2 text-[#b8bad2]">{icon}{label}</span><span className="font-semibold text-white">{value}</span></div>;
}
