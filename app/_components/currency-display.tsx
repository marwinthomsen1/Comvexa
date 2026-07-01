"use client";

import { useEffect, useState } from "react";

const currencies = [
  { code: "USD", label: "USD" },
  { code: "KWD", label: "KWD" },
  { code: "SAR", label: "SAR" },
  { code: "AED", label: "AED" },
  { code: "QAR", label: "QAR" },
  { code: "BHD", label: "BHD" },
  { code: "OMR", label: "OMR" },
  { code: "EUR", label: "EUR" },
  { code: "GBP", label: "GBP" },
  { code: "SGD", label: "SGD" },
];

const rates: Record<string, number> = {
  USD: 1,
  KWD: 0.31,
  SAR: 3.75,
  AED: 3.67,
  QAR: 3.64,
  BHD: 0.38,
  OMR: 0.38,
  EUR: 0.93,
  GBP: 0.79,
  SGD: 1.35,
};

function readCurrency() {
  try {
    const settings = window.localStorage.getItem("comvexa-workspace-settings");
    const parsed = settings ? JSON.parse(settings) : null;
    return parsed?.currency || window.localStorage.getItem("comvexa-selected-currency") || "USD";
  } catch {
    return "USD";
  }
}

function writeCurrency(currency: string) {
  window.localStorage.setItem("comvexa-selected-currency", currency);

  try {
    const saved = window.localStorage.getItem("comvexa-workspace-settings");
    const settings = saved ? JSON.parse(saved) : {};
    window.localStorage.setItem("comvexa-workspace-settings", JSON.stringify({ ...settings, currency }));
  } catch {
    window.localStorage.setItem("comvexa-workspace-settings", JSON.stringify({ currency }));
  }

  window.dispatchEvent(new Event("comvexa-settings-change"));
  window.dispatchEvent(new Event("comvexa-currency-change"));
}

function useCurrency() {
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    function syncCurrency() {
      setCurrency(readCurrency());
    }

    syncCurrency();
    window.addEventListener("storage", syncCurrency);
    window.addEventListener("comvexa-settings-change", syncCurrency);
    window.addEventListener("comvexa-currency-change", syncCurrency);

    return () => {
      window.removeEventListener("storage", syncCurrency);
      window.removeEventListener("comvexa-settings-change", syncCurrency);
      window.removeEventListener("comvexa-currency-change", syncCurrency);
    };
  }, []);

  return currency;
}

export function convertCurrencyAmount(usdAmount: number, currency: string) {
  return usdAmount * (rates[currency] ?? 1);
}

function formatCurrency(usdAmount: number, currency: string, compact = false, maximumFractionDigits = compact ? 1 : 0) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits,
  }).format(convertCurrencyAmount(usdAmount, currency));
}

export function CurrencySelector({
  compact = false,
  tone = "dark",
}: {
  compact?: boolean;
  tone?: "dark" | "light";
}) {
  const currency = useCurrency();
  const selectClass =
    tone === "light"
      ? "h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none hover:bg-slate-50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      : "h-10 rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-semibold text-white outline-none hover:bg-white/15 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-400/20 [&_option]:bg-white [&_option]:text-slate-950";

  return (
    <label className={`flex items-center gap-2 text-sm font-semibold ${compact ? "" : "text-slate-300"}`}>
      <span className="sr-only">Display currency</span>
      <select
        value={currency}
        onChange={(event) => {
          writeCurrency(event.target.value);
        }}
        className={selectClass}
      >
        {currencies.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CurrencyAmount({
  usd,
  compact = false,
}: {
  usd: number;
  compact?: boolean;
}) {
  const currency = useCurrency();

  return <span data-no-translate>{formatCurrency(usd, currency, compact)}</span>;
}

export function CurrencyValue({
  usd,
  currency,
  compact = false,
  maximumFractionDigits,
}: {
  usd: number;
  currency: string;
  compact?: boolean;
  maximumFractionDigits?: number;
}) {
  return (
    <span data-no-translate>
      {formatCurrencyAmount(usd, currency, compact, maximumFractionDigits)}
    </span>
  );
}

export function useSelectedCurrency() {
  return useCurrency();
}

export function formatCurrencyAmount(
  usd: number,
  currency: string,
  compact = false,
  maximumFractionDigits?: number,
) {
  return formatCurrency(usd, currency, compact, maximumFractionDigits);
}
