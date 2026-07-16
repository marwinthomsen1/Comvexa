"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MailCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://comvexa.net").replace(/\/$/, "");

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "");
    const companyName = String(formData.get("companyName") ?? "");
    const email = String(formData.get("email") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${appUrl}/dashboard/subscription`,
          data: {
            full_name: fullName,
            company_name: companyName,
            phone,
            plan: "basic",
          },
        },
      });

      if (signUpError || !authData.user) {
        setError(signUpError?.message ?? "Could not create your account.");
        return;
      }

      if (authData.session) {
        await supabase.auth.signOut();
        setRegisteredEmail(email);
        setConfirmationEmailSent(false);
        setError(
          "Email confirmation is not enabled yet. Please contact Comvexa support before signing in.",
        );
        return;
      }

      setRegisteredEmail(email);
      setConfirmationEmailSent(true);
      setMessage("We sent you a confirmation link. Open it before logging in.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create your account.");
    } finally {
      setIsLoading(false);
    }
  }

  async function resendConfirmation() {
    setError("");
    setResendMessage("");
    setIsResending(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: registeredEmail,
        options: { emailRedirectTo: `${appUrl}/dashboard/subscription` },
      });

      if (resendError) {
        setError(resendError.message);
        return;
      }

      setResendMessage("A new confirmation email has been sent.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not resend the confirmation email.");
    } finally {
      setIsResending(false);
    }
  }

  if (registeredEmail) {
    return (
      <section className="mt-8 overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-cyan-900 text-white shadow-lg shadow-cyan-200">
          <MailCheck size={30} />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">One last step</p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-950">
          {confirmationEmailSent ? "Confirm your email" : "Email confirmation unavailable"}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
          {confirmationEmailSent ? (
            <>
              We sent a confirmation link to <strong className="text-slate-900">{registeredEmail}</strong>. Open the link to activate your Comvexa account, then log in.
            </>
          ) : (
            <>
              Comvexa stopped the automatic login for <strong className="text-slate-900">{registeredEmail}</strong>. Email confirmation must be enabled before new accounts can sign in.
            </>
          )}
        </p>
        {confirmationEmailSent ? (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-cyan-100">
            <CheckCircle2 size={17} className="text-emerald-600" />
            Check your inbox and spam folder
          </div>
        ) : null}
        {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
        {resendMessage ? <p className="mt-4 text-sm font-medium text-emerald-700">{resendMessage}</p> : null}
        <div className={`mt-5 grid gap-3 ${confirmationEmailSent ? "sm:grid-cols-2" : ""}`}>
          {confirmationEmailSent ? (
            <button
              type="button"
              onClick={() => void resendConfirmation()}
              disabled={isResending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-white px-4 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isResending ? "animate-spin" : ""} />
              {isResending ? "Sending..." : "Resend email"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="min-h-11 rounded-xl bg-[#ff6b4a] px-4 text-sm font-semibold text-white shadow-lg shadow-orange-100 transition hover:bg-[#ff5633]"
          >
            Go to login
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5">
      <div>
        <label htmlFor="fullName" className="text-sm font-semibold text-slate-800">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          className="mt-2 w-full rounded-xl border border-cyan-900/15 bg-white px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:rounded-2xl sm:py-3.5"
        />
      </div>
      <div>
        <label htmlFor="companyName" className="text-sm font-semibold text-slate-800">
          Company name
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          required
          className="mt-2 w-full rounded-xl border border-cyan-900/15 bg-white px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:rounded-2xl sm:py-3.5"
        />
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-slate-800">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-xl border border-cyan-900/15 bg-white px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:rounded-2xl sm:py-3.5"
        />
      </div>
      <div>
        <label htmlFor="phone" className="text-sm font-semibold text-slate-800">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          className="mt-2 w-full rounded-xl border border-cyan-900/15 bg-white px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:rounded-2xl sm:py-3.5"
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="password" className="text-sm font-semibold text-slate-800">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="mt-2 w-full rounded-xl border border-cyan-900/15 bg-white px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:rounded-2xl sm:py-3.5"
        />
      </div>
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:col-span-2">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-800 sm:col-span-2">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-xl bg-[#ff6b4a] px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-orange-200/70 transition hover:-translate-y-0.5 hover:bg-[#ff5633] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:hover:translate-y-0 sm:col-span-2 sm:rounded-2xl sm:py-3.5"
      >
        {isLoading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
