"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
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
  priceUsd: number;
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
    const yearly = plan.priceUsd * 10;
    return billing === "monthly" ? plan.priceUsd : yearly;
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
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setBilling(option)}
              className={`rounded-md px-4 py-2 text-sm font-semibold capitalize transition ${
                billing === option
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              {option === "monthly" ? text.monthly : text.yearly}
            </button>
          ))}
        </div>
        <CurrencySelector compact tone="light" />
        <LanguageSelector tone="light" />
      </div>
      <p className="mt-3 text-center text-sm font-medium text-slate-600">
        {billing === "yearly" ? text.yearlyNote : text.monthlyNote}
      </p>
      {error ? (
        <p className="mx-auto mt-3 max-w-lg rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative overflow-hidden rounded-lg border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
              plan.featured
                ? "border-emerald-500 bg-white text-slate-950 ring-4 ring-emerald-100"
                : "border-slate-200 bg-white text-slate-950"
            }`}
          >
            {plan.featured ? (
              <div className="absolute right-4 top-4 rounded-md bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                Best start
              </div>
            ) : null}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {plan.description}
                </p>
              </div>
              <span className={`shrink-0 rounded-md px-3 py-1 text-xs font-semibold ${
                plan.featured ? "mt-8 bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}>
                {plan.trial}
              </span>
            </div>
            <p className="mt-7 text-4xl font-semibold">
              <CurrencyValue usd={priceFor(plan)} currency={currency} />
              <span className="text-base font-medium text-slate-500">
                /{billing === "monthly" ? text.month : text.year}
              </span>
            </p>
            {billing === "yearly" ? (
              <p className="mt-2 text-sm text-slate-500">
                {text.equivalent} <CurrencyValue usd={priceFor(plan) / 12} currency={currency} />/{text.month}.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => openCheckout(plan)}
              disabled={pendingPlan === plan.name}
              className={`mt-7 block w-full rounded-md px-5 py-3 text-center text-sm font-semibold shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 ${
                plan.featured
                  ? "bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700"
                  : "bg-slate-950 text-white shadow-slate-200 hover:bg-slate-800"
              }`}
            >
              {pendingPlan === plan.name ? "Opening Paddle..." : "Continue"}
            </button>
            <ul className="mt-7 max-h-72 space-y-3 overflow-y-auto pr-2 text-sm [scrollbar-width:thin]">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <Check className="mt-0.5 shrink-0 text-emerald-700" size={16} />
                  <span className="text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
