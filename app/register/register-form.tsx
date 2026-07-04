"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase/client";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://comvexa.net").replace(/\/$/, "");

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(false);
      setError(signUpError?.message ?? "Could not create your account.");
      return;
    }
    
    setIsLoading(false);

    if (authData.session) {
      router.push("/dashboard/subscription");
      router.refresh();
      return;
    }

    setMessage("Account created. Check your email to confirm your login.");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="fullName" className="text-sm font-semibold text-slate-800">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          className="mt-2 w-full rounded-2xl border border-cyan-900/15 bg-white px-4 py-3.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
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
          className="mt-2 w-full rounded-2xl border border-cyan-900/15 bg-white px-4 py-3.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
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
          className="mt-2 w-full rounded-2xl border border-cyan-900/15 bg-white px-4 py-3.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
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
          className="mt-2 w-full rounded-2xl border border-cyan-900/15 bg-white px-4 py-3.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
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
          className="mt-2 w-full rounded-2xl border border-cyan-900/15 bg-white px-4 py-3.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
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
        className="rounded-2xl bg-[#ff6b4a] px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-orange-200/70 transition hover:-translate-y-0.5 hover:bg-[#ff5633] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:hover:translate-y-0 sm:col-span-2"
      >
        {isLoading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
