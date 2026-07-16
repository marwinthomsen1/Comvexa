"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, ChevronDown, MailCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://comvexa.net").replace(/\/$/, "");

const countryCallingCodes = [
  ["Kuwait", "+965"],
  ["Saudi Arabia", "+966"],
  ["United Arab Emirates", "+971"],
  ["Bahrain", "+973"],
  ["Qatar", "+974"],
  ["Oman", "+968"],
  ["Jordan", "+962"],
  ["Lebanon", "+961"],
  ["Egypt", "+20"],
  ["Iraq", "+964"],
  ["Palestine", "+970"],
  ["Turkey", "+90"],
  ["India", "+91"],
  ["Pakistan", "+92"],
  ["Bangladesh", "+880"],
  ["Philippines", "+63"],
  ["Indonesia", "+62"],
  ["Malaysia", "+60"],
  ["Singapore", "+65"],
  ["China", "+86"],
  ["Japan", "+81"],
  ["South Korea", "+82"],
  ["Australia", "+61"],
  ["New Zealand", "+64"],
  ["United Kingdom", "+44"],
  ["Ireland", "+353"],
  ["Germany", "+49"],
  ["France", "+33"],
  ["Italy", "+39"],
  ["Spain", "+34"],
  ["Netherlands", "+31"],
  ["Belgium", "+32"],
  ["Switzerland", "+41"],
  ["Austria", "+43"],
  ["Sweden", "+46"],
  ["Norway", "+47"],
  ["Denmark", "+45"],
  ["Finland", "+358"],
  ["Poland", "+48"],
  ["Portugal", "+351"],
  ["Greece", "+30"],
  ["Romania", "+40"],
  ["Russia", "+7"],
  ["Ukraine", "+380"],
  ["United States", "+1"],
  ["Canada", "+1"],
  ["Mexico", "+52"],
  ["Brazil", "+55"],
  ["Argentina", "+54"],
  ["South Africa", "+27"],
  ["Nigeria", "+234"],
  ["Kenya", "+254"],
  ["Morocco", "+212"],
  ["Tunisia", "+216"],
  ["Algeria", "+213"],
] as const;

function isValidEmailAddress(email: string) {
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(
    email,
  );
}

export function RegisterForm() {
  const router = useRouter();
  const countryPickerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("Kuwait");
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const selectedCountryCode =
    countryCallingCodes.find(([country]) => country === selectedCountry)?.[1] ?? "+965";

  useEffect(() => {
    if (!countryPickerOpen) {
      return;
    }

    function closeCountryPicker(event: MouseEvent) {
      if (!countryPickerRef.current?.contains(event.target as Node)) {
        setCountryPickerOpen(false);
      }
    }

    function closeCountryPickerOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCountryPickerOpen(false);
      }
    }

    window.addEventListener("mousedown", closeCountryPicker);
    window.addEventListener("keydown", closeCountryPickerOnEscape);

    return () => {
      window.removeEventListener("mousedown", closeCountryPicker);
      window.removeEventListener("keydown", closeCountryPickerOnEscape);
    };
  }, [countryPickerOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const companyName = String(formData.get("companyName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const submittedCountryCode = String(formData.get("countryCode") ?? "");
    const localPhone = String(formData.get("phone") ?? "").replace(/\D/g, "").replace(/^0+/, "");
    const password = String(formData.get("password") ?? "");

    if (!isValidEmailAddress(email)) {
      setError("Enter a valid email address with a complete domain, such as name@gmail.com.");
      setIsLoading(false);
      return;
    }

    if (!countryCallingCodes.some(([, code]) => code === submittedCountryCode)) {
      setError("Choose a valid country calling code.");
      setIsLoading(false);
      return;
    }

    if (localPhone.length < 6 || localPhone.length > 14) {
      setError("Enter a valid phone number containing 6 to 14 digits.");
      setIsLoading(false);
      return;
    }

    const phone = `${submittedCountryCode}${localPhone}`;

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
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="email"
          placeholder="name@company.com"
          required
          className="mt-2 w-full rounded-xl border border-cyan-900/15 bg-white px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:rounded-2xl sm:py-3.5"
        />
      </div>
      <div>
        <label htmlFor="phone" className="text-sm font-semibold text-slate-800">
          Phone
        </label>
        <div className="mt-2 flex rounded-xl border border-cyan-900/15 bg-white shadow-sm transition focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100 hover:border-cyan-500/50 sm:rounded-2xl">
          <div ref={countryPickerRef} className="relative w-28 shrink-0">
            <input type="hidden" name="countryCode" value={selectedCountryCode} />
            <button
              type="button"
              id="countryCode"
              onClick={() => setCountryPickerOpen((open) => !open)}
              aria-label="Choose country calling code"
              aria-haspopup="listbox"
              aria-expanded={countryPickerOpen}
              className="flex h-full w-full items-center justify-center gap-1.5 rounded-l-xl border-r border-cyan-900/10 bg-cyan-50/70 px-3 py-3 text-sm font-semibold text-slate-800 outline-none sm:rounded-l-2xl sm:py-3.5"
            >
              <span>{selectedCountryCode}</span>
              <ChevronDown size={15} className={`shrink-0 text-cyan-800 transition ${countryPickerOpen ? "rotate-180" : ""}`} />
            </button>
            {countryPickerOpen ? (
              <div
                role="listbox"
                aria-label="Country calling codes"
                className="absolute left-0 top-[calc(100%+0.6rem)] z-50 max-h-72 w-[min(19rem,calc(100vw-3rem))] overflow-y-auto rounded-2xl border border-cyan-900/10 bg-white p-2 shadow-[0_22px_55px_rgba(8,47,73,0.2)] [scrollbar-width:thin]"
              >
                {countryCallingCodes.map(([country, code]) => {
                  const selected = selectedCountry === country;

                  return (
                    <button
                      key={`${country}-${code}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setSelectedCountry(country);
                        setCountryPickerOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        selected
                          ? "bg-cyan-50 font-semibold text-cyan-950"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{country}</span>
                      <span className="flex shrink-0 items-center gap-2 font-semibold text-cyan-800">
                        {code}
                        {selected ? <Check size={14} /> : <span className="w-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="Phone number"
            minLength={6}
            maxLength={20}
            pattern="[0-9 ()-]{6,20}"
            title="Enter 6 to 14 phone digits."
            required
            className="min-w-0 flex-1 bg-white px-3 py-3 text-sm outline-none placeholder:text-slate-400 sm:py-3.5"
          />
        </div>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="password" className="text-sm font-semibold text-slate-800">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
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
