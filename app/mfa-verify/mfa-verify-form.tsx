"use client";

import { FormEvent, useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";

export function MfaVerifyForm() {
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function prepareChallenge() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        window.location.replace("/login");
        return;
      }

      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (assurance?.currentLevel === "aal2") {
        completeRedirect();
        return;
      }

      const { data, error: factorsError } = await supabase.auth.mfa.listFactors();

      if (factorsError || !data.totp[0]) {
        setError(factorsError?.message ?? "No authenticator is connected to this account.");
        setLoading(false);
        return;
      }

      setFactorId(data.totp[0].id);
      setLoading(false);
    }

    void prepareChallenge();
  }, []);

  function completeRedirect() {
    const storedTarget = window.sessionStorage.getItem("comvexa-mfa-return-to");
    const safeTarget =
      storedTarget?.startsWith("/") && !storedTarget.startsWith("//")
        ? storedTarget
        : "/dashboard";
    window.sessionStorage.removeItem("comvexa-mfa-return-to");
    window.location.replace(safeTarget);
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!factorId || !/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your authenticator app.");
      return;
    }

    setVerifying(true);
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (verifyError) {
      setError("That code is invalid or expired. Wait for a new code and try again.");
      setVerifying(false);
      return;
    }

    completeRedirect();
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  return (
    <form onSubmit={verifyCode} className="mt-6">
      <label htmlFor="mfa-code" className="text-sm font-semibold text-slate-800">Authenticator code</label>
      <input
        id="mfa-code"
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        disabled={loading}
        className="mt-2 h-14 w-full rounded-2xl border border-cyan-900/15 bg-white px-4 text-center text-xl font-semibold tracking-[0.45em] outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-50"
      />
      {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{error}</p> : null}
      <button disabled={loading || verifying || code.length !== 6} className="mt-5 h-12 w-full rounded-2xl bg-[#ff6b4a] px-5 text-sm font-semibold text-white shadow-lg shadow-orange-200 disabled:opacity-50">
        {loading ? "Loading security..." : verifying ? "Verifying..." : "Verify and continue"}
      </button>
      <button type="button" onClick={signOut} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
        <LogOut size={16} />
        Sign out
      </button>
    </form>
  );
}
