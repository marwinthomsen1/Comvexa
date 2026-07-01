"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
          className="mt-2 w-full rounded-2xl border border-cyan-900/15 bg-white px-4 py-3.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-semibold text-slate-800">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          required
          className="mt-2 w-full rounded-2xl border border-cyan-900/15 bg-white px-4 py-3.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
        />
      </div>
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-2xl bg-[#ff6b4a] px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-orange-200/70 transition hover:-translate-y-0.5 hover:bg-[#ff5633] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:hover:translate-y-0"
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
