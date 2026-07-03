import { Suspense } from "react";
import { PaddleCheckoutLauncher } from "./paddle-checkout-launcher";

export default function PaddleCheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-700">
          Opening Paddle checkout...
        </main>
      }
    >
      <PaddleCheckoutLauncher />
    </Suspense>
  );
}
