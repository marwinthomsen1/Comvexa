"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { openPaddleCheckout } from "@/src/lib/paddle/browser-checkout";
import { activatePaidPlanFromPending } from "../dashboard/_components/payment-status";

export function PaddleCheckoutLauncher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("_ptxn");
  const [error, setError] = useState("");
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (!transactionId) {
      return;
    }

    openPaddleCheckout(transactionId, undefined, (event) => {
      if (event.name === "checkout.completed") {
        activatePaidPlanFromPending();
        router.push("/dashboard?payment=success");
      }
    })
      .then(() => setOpened(true))
      .catch((checkoutError) => {
        setError(
          checkoutError instanceof Error
            ? checkoutError.message
            : "Could not open Paddle checkout.",
        );
      });
  }, [router, transactionId]);

  const displayError = transactionId ? error : "Missing Paddle transaction.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          {opened ? <CheckCircle2 size={22} /> : <Loader2 className="animate-spin" size={22} />}
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-slate-950">
          {displayError ? "Paddle checkout could not open" : "Opening Paddle checkout"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {displayError
            ? displayError
            : "Keep this page open while Paddle loads your secure checkout."}
        </p>
        {displayError ? (
          <Link
            href="/dashboard/subscription/payment"
            className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Back to payment
          </Link>
        ) : null}
      </section>
    </main>
  );
}
