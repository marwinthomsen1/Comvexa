"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, RotateCcw, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

type VerifiedFactor = {
  id: string;
  friendly_name?: string;
};

export function MfaSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [factor, setFactor] = useState<VerifiedFactor | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  async function loadFactors() {
    const { data, error: factorsError } = await supabase.auth.mfa.listFactors();

    if (factorsError) {
      setError(factorsError.message);
      return;
    }

    setFactor(data.totp[0] ?? null);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadFactors().finally(() => setLoading(false));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  async function startEnrollment() {
    setError("");
    setMessage("");
    setWorking(true);

    try {
      const listed = await supabase.auth.mfa.listFactors();

      if (listed.error) {
        throw listed.error;
      }

      await Promise.all(
        listed.data.all
          .filter((item) => item.factor_type === "totp" && item.status === "unverified")
          .map((item) => supabase.auth.mfa.unenroll({ factorId: item.id })),
      );

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Comvexa authenticator",
      });

      if (enrollError) {
        throw enrollError;
      }

      setEnrollment({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setShowSecret(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not start two-step verification.");
    } finally {
      setWorking(false);
    }
  }

  async function verifyEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!enrollment || !/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your authenticator app.");
      return;
    }

    setWorking(true);
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollment.factorId,
      code,
    });

    if (verifyError) {
      setError(
        "Code not accepted. Make sure your phone uses automatic date and time, or generate a new QR code and scan it again.",
      );
      setWorking(false);
      return;
    }

    setEnrollment(null);
    setCode("");
    await loadFactors();
    setMessage("Two-step verification is now enabled.");
    setWorking(false);
  }

  async function cancelEnrollment() {
    if (enrollment) {
      await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
    }

    setEnrollment(null);
    setCode("");
    setError("");
  }

  async function rotateEnrollment() {
    setError("");
    setMessage("");
    setCode("");
    setShowSecret(false);
    setWorking(true);

    if (enrollment) {
      await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
    }

    setEnrollment(null);
    await startEnrollment();
  }

  async function disableMfa() {
    if (!factor || !window.confirm("Disable two-step verification for this account?")) {
      return;
    }

    setError("");
    setMessage("");
    setWorking(true);
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId: factor.id,
    });

    if (unenrollError) {
      setError(unenrollError.message);
      setWorking(false);
      return;
    }

    setFactor(null);
    setMessage("Two-step verification has been disabled.");
    setWorking(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-sm">
        <Loader2 className="animate-spin text-cyan-700" size={18} />
        Loading account security...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-6 bg-slate-950 p-6 text-white lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-200/20">
            <ShieldCheck size={23} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Account security</p>
            <h3 className="mt-2 text-xl font-semibold">Two-step verification</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Require a rotating six-digit code from an authenticator app after entering your password.
            </p>
          </div>
        </div>
        <span className={`w-fit rounded-full px-3 py-2 text-xs font-semibold ${factor ? "bg-emerald-300/15 text-emerald-200" : "bg-white/10 text-slate-300"}`}>
          {factor ? "Enabled" : "Not enabled"}
        </span>
      </div>

      <div className="p-6">
        {enrollment ? (
          <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:items-center">
            <div className="rounded-3xl border border-cyan-100 bg-cyan-50 p-3">
              {/* Supabase returns an in-memory SVG data URL, which Next Image rejects. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enrollment.qrCode}
                alt="Authenticator setup QR code"
                width={220}
                height={220}
                className="mx-auto size-full rounded-2xl bg-white"
              />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <Smartphone className="text-cyan-700" size={21} />
                <h4 className="font-semibold text-slate-950">Connect your authenticator app</h4>
              </div>
              <ol className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                <li>1. Open Google Authenticator, Microsoft Authenticator, or Authy.</li>
                <li>2. Scan the QR code.</li>
                <li>3. Enter the six-digit code shown in the app.</li>
              </ol>
              <div data-no-translate className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manual setup key</p>
                  <button
                    type="button"
                    onClick={() => setShowSecret((visible) => !visible)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-800"
                  >
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showSecret ? "Hide" : "Reveal"}
                  </button>
                </div>
                <code className="mt-2 block break-all text-sm font-semibold text-slate-800">
                  {showSecret ? enrollment.secret : "•••• •••• •••• •••• •••• •••• •••• ••••"}
                </code>
              </div>
              <form onSubmit={verifyEnrollment} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  aria-label="Six-digit authenticator code"
                  className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 text-center text-lg font-semibold tracking-[0.35em] outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
                <button disabled={working || code.length !== 6} className="h-12 rounded-xl bg-cyan-800 px-5 text-sm font-semibold text-white disabled:opacity-50">
                  {working ? "Verifying..." : "Enable verification"}
                </button>
                <button type="button" onClick={rotateEnrollment} disabled={working} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-cyan-200 px-4 text-sm font-semibold text-cyan-800">
                  <RotateCcw size={16} />
                  New QR
                </button>
                <button type="button" onClick={cancelEnrollment} disabled={working} className="h-12 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700">
                  Cancel
                </button>
              </form>
            </div>
          </div>
        ) : factor ? (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><KeyRound size={20} /></span>
              <div>
                <p className="font-semibold text-slate-950">Authenticator protection is active</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Future logins require your password and a six-digit authenticator code.</p>
              </div>
            </div>
            <button type="button" onClick={disableMfa} disabled={working} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
              <ShieldOff size={17} />
              {working ? "Disabling..." : "Disable"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-950">Protect your account from password theft</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Setup takes about one minute and works without SMS charges or mobile coverage.</p>
            </div>
            <button type="button" onClick={startEnrollment} disabled={working} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-800 px-5 text-sm font-semibold text-white hover:bg-cyan-900 disabled:opacity-50">
              <ShieldCheck size={17} />
              {working ? "Preparing..." : "Set up authenticator"}
            </button>
          </div>
        )}

        {error ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{error}</p> : null}
        {message ? <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      </div>
    </div>
  );
}
