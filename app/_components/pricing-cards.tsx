"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
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
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const currency = useSelectedCurrency();
  const text = useHomeText();

  function priceFor(plan: Plan) {
    const yearly = plan.priceUsd * 10;
    return billing === "monthly" ? plan.priceUsd : yearly;
  }

  return (
    <>
      <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <div className="inline-flex rounded-2xl border border-white/15 bg-white/10 p-1">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setBilling(option)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
                billing === option
                  ? "bg-[#ff7a59] text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {option === "monthly" ? text.monthly : text.yearly}
            </button>
          ))}
        </div>
        <CurrencySelector compact />
        <LanguageSelector />
      </div>
      <p className="mt-3 text-center text-sm text-amber-200">
        {billing === "yearly" ? text.yearlyNote : text.monthlyNote}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-3xl border p-6 ${plan.featured ? "border-amber-300 bg-white text-slate-950 shadow-2xl shadow-cyan-950/30" : "border-white/10 bg-white/[0.06] text-white"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className={`mt-2 text-sm leading-6 ${plan.featured ? "text-slate-600" : "text-slate-300"}`}>
                  {plan.description}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${plan.featured ? "bg-cyan-50 text-cyan-800" : "bg-white/10 text-slate-200"}`}>
                {plan.trial}
              </span>
            </div>
            <p className="mt-7 text-4xl font-semibold">
              <CurrencyValue usd={priceFor(plan)} currency={currency} />
              <span className={`text-base font-medium ${plan.featured ? "text-slate-500" : "text-slate-400"}`}>
                /{billing === "monthly" ? text.month : text.year}
              </span>
            </p>
            {billing === "yearly" ? (
              <p className={`mt-2 text-sm ${plan.featured ? "text-slate-500" : "text-slate-400"}`}>
                {text.equivalent} <CurrencyValue usd={priceFor(plan) / 12} currency={currency} />/{text.month}.
              </p>
            ) : null}
            <Link
              href="/register"
              className={`mt-7 block rounded-xl px-5 py-3 text-center text-sm font-semibold ${plan.featured ? "bg-[#ff7a59] text-white hover:bg-[#ff6741]" : "bg-white text-slate-950 hover:bg-slate-100"}`}
            >
              {text.signUpFirst}
            </Link>
            <ul className="mt-7 max-h-72 space-y-3 overflow-y-auto pr-2 text-sm [scrollbar-width:thin]">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <Check className="mt-0.5 shrink-0 text-amber-300" size={16} />
                  <span className={plan.featured ? "text-slate-700" : "text-slate-300"}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
