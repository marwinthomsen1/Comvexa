"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Landmark, LockKeyhole, WalletCards } from "lucide-react";

const planPrices: Record<string, number> = {
  Basic: 29,
  Pro: 79,
  Ultra: 149,
};

const paymentMethods = [
  { name: "Card", icon: CreditCard, description: "Visa, Mastercard, Amex" },
  { name: "Bank", icon: Landmark, description: "Manual bank transfer" },
  { name: "Wallet", icon: WalletCards, description: "Digital wallet ready" },
];

export default function PaymentPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("Pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSelectedPlan(window.localStorage.getItem("comvexa-selected-plan") ?? "Pro");
      const storedCycle = window.localStorage.getItem("comvexa-billing-cycle");

      if (storedCycle === "monthly" || storedCycle === "yearly") {
        setBillingCycle(storedCycle);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const monthlyPrice = planPrices[selectedPlan] ?? 79;
  const total = useMemo(
    () => (billingCycle === "yearly" ? monthlyPrice * 10 : monthlyPrice),
    [billingCycle, monthlyPrice],
  );

  function savePaymentSetup() {
    window.localStorage.setItem("comvexa-selected-plan", selectedPlan);
    window.localStorage.setItem("comvexa-billing-cycle", billingCycle);
    window.localStorage.setItem("comvexa-payment-method", paymentMethod);
    window.localStorage.setItem("comvexa-payment-complete", "true");
    window.dispatchEvent(new Event("comvexa-plan-change"));
    setSaved(true);
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Step 2 of 2
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">Payment setup</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Add payment details for your selected Comvexa plan. This page is ready
          for Stripe, Paddle, or another payment gateway integration.
        </p>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <LockKeyhole size={20} />
            </span>
            <div>
              <h3 className="font-semibold text-slate-950">Payment method</h3>
              <p className="text-sm text-slate-500">Choose how this company will pay.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = method.name === paymentMethod;

              return (
                <button
                  key={method.name}
                  type="button"
                  onClick={() => setPaymentMethod(method.name)}
                  className={`rounded-2xl border p-4 text-left ${
                    isSelected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <Icon className={isSelected ? "text-emerald-700" : "text-slate-500"} size={22} />
                  <span className="mt-3 block text-sm font-semibold text-slate-950">{method.name}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{method.description}</span>
                </button>
              );
            })}
          </div>

          <form className="mt-6 grid gap-4">
            <input
              placeholder="Cardholder name"
              className="rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
            <input
              placeholder="Card number"
              className="rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="MM/YY"
                className="rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
              <input
                placeholder="CVC"
                className="rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 ring-1 ring-amber-100">
              This form does not charge real cards yet. Connect a payment
              provider before processing live payments.
            </p>
          </form>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
          <h3 className="font-semibold text-slate-950">Order summary</h3>
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
              <span className="font-semibold text-slate-950">{selectedPlan === "Pro" ? "3 days" : "None"}</span>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-950">Due now</span>
                <span className="text-2xl font-semibold text-slate-950">${total}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={savePaymentSetup}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <CheckCircle2 size={17} />
            {saved ? "Opening dashboard..." : "Complete setup and open dashboard"}
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
