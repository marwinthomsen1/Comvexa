"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Clock3,
  HeartHandshake,
  LoaderCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
import {
  clearScheduledPlanCancellation,
  setScheduledPlanCancellation,
} from "../_components/payment-status";

const reasons = [
  { value: "too_expensive", label: "The price is too high", text: "The subscription no longer fits my budget." },
  { value: "not_using_enough", label: "I am not using it enough", text: "My team is not getting enough value right now." },
  { value: "missing_features", label: "A feature I need is missing", text: "Comvexa does not yet cover an important workflow." },
  { value: "difficult_to_use", label: "It is difficult to use", text: "Setup or everyday work feels too complicated." },
  { value: "switching_product", label: "I am switching products", text: "Another product is a better fit for my company." },
  { value: "technical_issues", label: "I experienced technical issues", text: "Reliability or performance affected my work." },
  { value: "temporary_pause", label: "I only need a temporary break", text: "The business may return later." },
  { value: "business_closed", label: "The business is closing", text: "I no longer need company management software." },
  { value: "other", label: "Another reason", text: "My reason is not listed here." },
] as const;

const retentionFactors = [
  { value: "lower_price", label: "A lower price" },
  { value: "missing_feature", label: "A specific feature" },
  { value: "onboarding_help", label: "More setup or training help" },
  { value: "temporary_pause", label: "A pause option" },
  { value: "better_support", label: "Faster support" },
  { value: "nothing", label: "Nothing right now" },
  { value: "other", label: "Something else" },
] as const;

type CancellationState = {
  available: boolean;
  hasSubscription: boolean;
  scheduled: boolean;
  effectiveAt: string | null;
  scheduledAt?: string | null;
  plan?: string | null;
  subscriptionStatus?: string;
  reason?: string | null;
};

async function accessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function friendlyDate(value: string | null) {
  if (!value) return "the end of your current billing period";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function CancelSubscriptionCard() {
  const [state, setState] = useState<CancellationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [retentionFactor, setRetentionFactor] = useState("nothing");
  const [feedback, setFeedback] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCancellationState() {
      try {
        const token = await accessToken();
        if (!token) return;

        const response = await fetch("/api/subscription/cancel", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const nextState = await response.json();

        if (!response.ok) {
          setError(nextState.error ?? "Could not load cancellation settings.");
          return;
        }

        setState(nextState);
        if (nextState.scheduled) {
          setScheduledPlanCancellation(nextState.effectiveAt);
        } else {
          clearScheduledPlanCancellation();
        }
      } catch {
        setError("Could not load cancellation settings.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadCancellationState();
  }, []);

  useEffect(() => {
    if (!isDialogOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) setIsDialogOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isDialogOpen, isSubmitting]);

  async function submitCancellation() {
    setError("");
    setIsSubmitting(true);

    try {
      const token = await accessToken();
      if (!token) throw new Error("Sign in before managing your subscription.");

      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason, retentionFactor, feedback, confirmed }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error ?? "Could not cancel this subscription.");

      setState((current) => ({
        ...(current ?? { available: false, hasSubscription: true }),
        available: false,
        scheduled: true,
        effectiveAt: result.effectiveAt,
        scheduledAt: result.scheduledAt,
        reason,
      }));
      setScheduledPlanCancellation(result.effectiveAt);
      setIsDialogOpen(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Could not cancel this subscription.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function keepPlan() {
    setError("");
    setIsUndoing(true);

    try {
      const token = await accessToken();
      if (!token) throw new Error("Sign in before managing your subscription.");

      const response = await fetch("/api/subscription/cancel", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error ?? "Could not keep this subscription active.");

      setState((current) => current ? { ...current, available: true, scheduled: false, effectiveAt: null, scheduledAt: null } : current);
      clearScheduledPlanCancellation();
    } catch (undoError) {
      setError(undoError instanceof Error ? undoError.message : "Could not keep this subscription active.");
    } finally {
      setIsUndoing(false);
    }
  }

  if (isLoading) {
    return (
      <section className="mt-6 flex items-center gap-3 rounded-3xl border border-[var(--comvexa-border,#d8e2dc)] bg-[var(--comvexa-surface,#fffefa)] p-5 text-sm font-bold text-[var(--comvexa-muted,#5d7477)]" role="status">
        <LoaderCircle className="animate-spin" size={18} />
        Loading plan management...
      </section>
    );
  }

  if (!state?.hasSubscription) {
    return error ? (
      <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>
    ) : null;
  }

  return (
    <>
      {state.scheduled ? (
        <section className="mt-6 overflow-hidden rounded-3xl border border-amber-200 bg-[var(--comvexa-surface,#fffefa)] shadow-sm">
          <div className="grid gap-6 bg-[var(--comvexa-warning-soft,#fff0ba)]/60 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-[var(--comvexa-warning,#8a6500)] ring-1 ring-amber-200"><Clock3 size={20} /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--comvexa-warning,#8a6500)]">Cancellation scheduled</p>
                <h2 className="mt-2 text-xl font-black tracking-[-0.035em] text-[var(--comvexa-text,#073d47)]">Your plan stays active until {friendlyDate(state.effectiveAt)}.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--comvexa-muted,#5d7477)]">There will be no renewal after that date. You can keep the plan any time before the cancellation takes effect.</p>
              </div>
            </div>
            <button type="button" onClick={keepPlan} disabled={isUndoing} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--comvexa-action,#073d47)] px-5 text-sm font-black text-[var(--comvexa-on-action,#ffffff)] disabled:opacity-60">
              {isUndoing ? <LoaderCircle className="animate-spin" size={16} /> : <HeartHandshake size={16} />}
              {isUndoing ? "Keeping plan..." : "Keep my plan"}
            </button>
          </div>
          {error ? <p className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700" role="alert">{error}</p> : null}
        </section>
      ) : state.available ? (
        <section className="mt-6 rounded-3xl border border-[var(--comvexa-border,#d8e2dc)] bg-[var(--comvexa-surface,#fffefa)] p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--comvexa-danger-soft,#fff0eb)] text-[var(--comvexa-danger,#c7432f)]"><ShieldCheck size={20} /></span>
              <div>
                <h2 className="font-black tracking-[-0.025em] text-[var(--comvexa-text,#073d47)]">Plan management</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--comvexa-muted,#5d7477)]">You can cancel future renewals while keeping access through the current paid billing period.</p>
              </div>
            </div>
            <button type="button" onClick={() => { setError(""); setIsDialogOpen(true); }} className="inline-flex h-11 items-center justify-center rounded-full border border-red-200 bg-white px-5 text-sm font-black text-[var(--comvexa-danger,#c7432f)] hover:bg-[var(--comvexa-danger-soft,#fff0eb)]">
              Cancel plan
            </button>
          </div>
          {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}
        </section>
      ) : null}

      {isDialogOpen && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-[10000] flex items-end justify-center overflow-y-auto bg-[#052f37]/65 p-0 backdrop-blur-sm sm:items-center sm:p-5">
          <section className="max-h-[96dvh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] border border-white/60 bg-[var(--comvexa-surface,#fffefa)] shadow-2xl sm:rounded-[2rem]" role="dialog" aria-modal="true" aria-labelledby="cancel-plan-title">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--comvexa-border,#d8e2dc)] bg-[color-mix(in_srgb,var(--comvexa-surface,#fffefa)_94%,transparent)] px-5 py-4 backdrop-blur sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--comvexa-danger,#c7432f)]">Before you go</p>
                <h2 id="cancel-plan-title" className="mt-1 text-2xl font-black tracking-[-0.045em] text-[var(--comvexa-text,#073d47)]">Why are you canceling?</h2>
              </div>
              <button type="button" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[var(--comvexa-border,#d8e2dc)] text-[var(--comvexa-muted,#5d7477)]" aria-label="Close cancellation dialog"><X size={18} /></button>
            </div>

            <div className="p-5 sm:p-6">
              <fieldset>
                <legend className="text-sm font-black text-[var(--comvexa-text,#073d47)]">Choose the main reason</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {reasons.map((item) => (
                    <label key={item.value} className={`cursor-pointer rounded-2xl border p-4 transition ${reason === item.value ? "border-[var(--comvexa-accent,#0c8b84)] bg-[var(--comvexa-accent-soft,#dffff8)] ring-2 ring-[var(--comvexa-accent,#0c8b84)]/10" : "border-[var(--comvexa-border,#d8e2dc)] hover:bg-[var(--comvexa-soft-surface,#eef9f5)]"}`}>
                      <span className="flex items-start gap-3">
                        <input type="radio" name="cancellation-reason" value={item.value} checked={reason === item.value} onChange={(event) => setReason(event.target.value)} className="mt-1" />
                        <span>
                          <span className="block text-sm font-black text-[var(--comvexa-text,#073d47)]">{item.label}</span>
                          <span className="mt-1 block text-xs leading-5 text-[var(--comvexa-muted,#5d7477)]">{item.text}</span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-black text-[var(--comvexa-text,#073d47)]">What might have helped you stay?</span>
                  <select value={retentionFactor} onChange={(event) => setRetentionFactor(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--comvexa-border,#d8e2dc)] bg-[var(--comvexa-surface,#fffefa)] px-3 text-sm text-[var(--comvexa-text,#073d47)] outline-none">
                    {retentionFactors.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-sm font-black text-[var(--comvexa-text,#073d47)]">Anything else we should know?</span>
                  <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} maxLength={1200} rows={3} placeholder="Optional feedback" className="mt-2 w-full rounded-xl border border-[var(--comvexa-border,#d8e2dc)] bg-[var(--comvexa-surface,#fffefa)] px-3 py-2.5 text-sm text-[var(--comvexa-text,#073d47)] outline-none" />
                </label>
              </div>

              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-[var(--comvexa-warning-soft,#fff0ba)]/55 p-4">
                <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" />
                <span>
                  <span className="block text-sm font-black text-[var(--comvexa-text,#073d47)]">I understand this stops the next renewal.</span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--comvexa-muted,#5d7477)]">My workspace remains available until the end of the current paid billing period, then the plan will be canceled.</span>
                </span>
              </label>

              {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[var(--comvexa-border,#d8e2dc)] pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="h-11 rounded-full border border-[var(--comvexa-border,#d8e2dc)] px-5 text-sm font-black text-[var(--comvexa-text,#073d47)]">Keep subscription</button>
                <button type="button" onClick={submitCancellation} disabled={!reason || !confirmed || isSubmitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--comvexa-danger,#c7432f)] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45">
                  {isSubmitting ? <LoaderCircle className="animate-spin" size={16} /> : <AlertTriangle size={16} />}
                  {isSubmitting ? "Scheduling cancellation..." : "Cancel at period end"}
                </button>
              </div>
            </div>
          </section>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
