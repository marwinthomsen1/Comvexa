"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { hasOwnerDashboardAccess, isAdminEmail } from "@/src/lib/admin/access";
import { supabase } from "@/src/lib/supabase/client";
import { enableOwnerPlanAccess } from "../dashboard/_components/payment-status";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://comvexa.net").replace(/\/$/, "");

export function LoginForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    if (hasOwnerDashboardAccess(email)) {
      enableOwnerPlanAccess("Ultra", "monthly", email);
    }

    router.push(isAdminEmail(email) ? "/admin" : "/dashboard");
    router.refresh();
  }

  async function sendPasswordReset() {
    setError("");
    setResetMessage("");

    const email = formRef.current
      ? String(new FormData(formRef.current).get("email") ?? "").trim()
      : "";

    if (!email) {
      setError("Enter your email first, then request a password reset.");
      return;
    }

    setIsSendingReset(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    });
    setIsSendingReset(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setResetMessage("Password reset email sent. Check your inbox.");
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-slate-800">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          required
          className="mt-2 w-full rounded-xl border border-cyan-900/15 bg-white px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:rounded-2xl sm:py-3.5"
        />
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="text-sm font-semibold text-slate-800">
            Password
          </label>
          <button
            type="button"
            onClick={sendPasswordReset}
            disabled={isSendingReset}
            className="text-sm font-semibold text-cyan-700 hover:text-cyan-900 disabled:text-slate-400"
          >
            {isSendingReset ? "Sending..." : "Forgot password?"}
          </button>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          required
          className="mt-2 w-full rounded-xl border border-cyan-900/15 bg-white px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:rounded-2xl sm:py-3.5"
        />
      </div>
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      {resetMessage ? (
        <p className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-800">
          {resetMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-[#ff6b4a] px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-orange-200/70 transition hover:-translate-y-0.5 hover:bg-[#ff5633] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:hover:translate-y-0 sm:rounded-2xl sm:py-3.5"
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
