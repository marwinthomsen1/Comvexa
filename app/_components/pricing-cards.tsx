"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
import { openPaddleCheckout } from "@/src/lib/paddle/browser-checkout";
import {
  activatePaidPlanFromPending,
  setPendingPaidPlan,
} from "../dashboard/_components/payment-status";
import { CurrencySelector, CurrencyValue, useSelectedCurrency } from "./currency-display";
import { LanguageSelector, useHomeText } from "./language-display";

type Plan = {
  name: string;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  description: string;
  trial: string;
  featured?: boolean;
  features: string[];
};

export function PricingCards({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [pendingPlan, setPendingPlan] = useState("");
  const [error, setError] = useState("");
  const currency = useSelectedCurrency();
  const text = useHomeText();

  function priceFor(plan: Plan) {
    return billing === "monthly" ? plan.monthlyPriceUsd : plan.yearlyPriceUsd;
  }

  async function openCheckout(plan: Plan) {
    setError("");
    setPendingPlan(plan.name);
    setPendingPaidPlan(plan.name, billing);

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      router.push("/register");
      return;
    }

    try {
      const response = await fetch("/api/paddle/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          plan: plan.name,
          billingCycle: billing,
          email: sessionData.session.user.email,
          userId: sessionData.session.user.id,
        }),
      });
      const checkout = await response.json();

      if (!response.ok || !checkout.transactionId) {
        setPendingPlan("");
        setError(checkout.error ?? "Could not open Paddle checkout.");
        return;
      }

      await openPaddleCheckout(checkout.transactionId, checkout.url, (event) => {
        if (event.name === "checkout.completed") {
          activatePaidPlanFromPending();
        }
      });
      setPendingPlan("");
    } catch (checkoutError) {
      setPendingPlan("");
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Could not open Paddle checkout.",
      );
    }
  }

  return (
    <>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
        <div
          className="inline-flex rounded-full border border-[#073d47]/10 bg-white p-1 shadow-sm"
          role="group"
          aria-label="Billing frequency"
        >
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={billing === option}
              onClick={() => setBilling(option)}
              className={`rounded-full px-5 py-2.5 text-sm font-black capitalize transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#39d9c6]/30 ${
                billing === option
                  ? "bg-[#073d47] text-white shadow-md"
                  : "text-[#527078] hover:text-[#073d47]"
              }`}
            >
              {option === "monthly" ? text.monthly : text.yearly}
            </button>
          ))}
        </div>
        <CurrencySelector compact tone="light" />
        <div className="lg:hidden">
          <LanguageSelector tone="light" />
        </div>
      </div>

      <p className="mt-3 text-center text-sm font-bold text-[#0c8b84]">
        {billing === "yearly" ? text.yearlyNote : text.monthlyNote}
      </p>

      {error ? (
        <p className="mx-auto mt-4 max-w-lg rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-10 grid items-start gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const visibleFeatures = plan.features.slice(0, 8);
          const extraFeatures = plan.features.slice(8);

          return (
            <article
              key={plan.name}
              className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_20px_55px_rgba(7,61,71,0.08)] transition hover:-translate-y-1 sm:p-7 ${
                plan.featured
                  ? "border-[#073d47] bg-[#073d47] text-white lg:-mt-3 lg:pb-10 lg:pt-10"
                  : "border-[#073d47]/10 bg-white text-[#073d47]"
              }`}
            >
              {plan.featured ? (
                <div className="absolute right-0 top-0 rounded-bl-2xl bg-[#ffc857] px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#073d47]">
                  Best start
                </div>
              ) : null}

              <div className="flex min-h-28 items-start justify-between gap-4">
                <div>
                  <p className={`text-xs font-black uppercase tracking-[0.18em] ${plan.featured ? "text-[#8ef0df]" : "text-[#ff6547]"}`}>Comvexa</p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.045em]">{plan.name}</h3>
                  <p className={`mt-3 max-w-xs text-sm leading-6 ${plan.featured ? "text-white/60" : "text-[#617a7f]"}`}>{plan.description}</p>
                </div>
              </div>

              <div className="mt-6 flex items-end gap-1">
                <p className="text-5xl font-black tracking-[-0.06em]">
                  <CurrencyValue usd={priceFor(plan)} currency={currency} maximumFractionDigits={2} />
                </p>
                <span className={`pb-1.5 text-sm font-bold ${plan.featured ? "text-white/50" : "text-[#74898d]"}`}>
                  /{billing === "monthly" ? text.month : text.year}
                </span>
              </div>

              {billing === "yearly" ? (
                <p className={`mt-2 text-xs font-bold ${plan.featured ? "text-[#8ef0df]" : "text-[#0c8b84]"}`}>
                  {text.equivalent} <CurrencyValue usd={priceFor(plan) / 12} currency={currency} maximumFractionDigits={2} />/{text.month}
                </p>
              ) : null}

              <span className={`mt-5 inline-flex rounded-full px-3 py-1.5 text-xs font-black ${plan.featured ? "bg-white/10 text-[#fff0ba]" : "bg-[#fff0ba] text-[#7a5700]"}`}>
                {plan.trial}
              </span>

              <button
                type="button"
                onClick={() => openCheckout(plan)}
                disabled={pendingPlan === plan.name}
                aria-live="polite"
                className={`mt-7 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-black shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 ${
                  plan.featured
                    ? "bg-[#ffc857] text-[#073d47] shadow-black/10 hover:bg-[#ffd66f] focus-visible:ring-[#ffc857]/30"
                    : "bg-[#c7432f] text-white shadow-orange-200 hover:bg-[#ad3524] focus-visible:ring-[#ff7757]/30"
                }`}
              >
                {pendingPlan === plan.name ? "Opening Paddle..." : "Continue"}
                {pendingPlan === plan.name ? null : <ArrowRight size={16} />}
              </button>

              <ul className="mt-7 space-y-3 text-sm">
                {visibleFeatures.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${plan.featured ? "bg-[#39d9c6]/15 text-[#8ef0df]" : "bg-[#dffff8] text-[#0c8b84]"}`}>
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span className={plan.featured ? "text-white/70" : "text-[#527078]"}>{feature}</span>
                  </li>
                ))}
              </ul>

              {extraFeatures.length ? (
                <details className={`mt-4 rounded-2xl border px-4 ${plan.featured ? "border-white/10 bg-white/[0.04]" : "border-[#073d47]/10 bg-[#fffaf0]"}`}>
                  <summary className={`cursor-pointer py-3 text-sm font-black ${plan.featured ? "text-[#8ef0df]" : "text-[#0c8b84]"}`}>
                    Show {extraFeatures.length} more features
                  </summary>
                  <ul className="space-y-3 pb-4 text-sm">
                    {extraFeatures.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <Check className={`mt-0.5 shrink-0 ${plan.featured ? "text-[#8ef0df]" : "text-[#0c8b84]"}`} size={15} />
                        <span className={plan.featured ? "text-white/70" : "text-[#527078]"}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </article>
          );
        })}
      </div>
    </>
  );
}
