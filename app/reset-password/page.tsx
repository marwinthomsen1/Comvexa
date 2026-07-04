"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 6) {
      setIsSaving(false);
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setIsSaving(false);
      setError("Passwords do not match.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Password updated. You can now sign in with your new password.");
  }

  return (
    <main className="min-h-screen bg-[#edf3f8] px-5 py-12 text-slate-950">
      <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <LockKeyhole size={24} />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase text-blue-700">Comvexa security</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Enter a new password for your Comvexa account.
        </p>

        <form onSubmit={updatePassword} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            New password
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-emerald-300"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Confirm password
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-emerald-300"
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSaving}
            className="h-12 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {isSaving ? "Updating..." : "Update password"}
          </button>
        </form>

        <Link href="/login" className="mt-5 inline-flex text-sm font-semibold text-emerald-700">
          Back to login
        </Link>
      </section>
    </main>
  );
}
