"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
const tutorialStorageKey = "comvexa-first-plan-tutorial-v1-complete";
const tutorialAutoShownKey = "comvexa-first-plan-tutorial-v1-auto-shown";
export const firstPlanUnlockedEvent = "comvexa-first-plan-unlocked";

const steps = [
  {
    title: "Start with Today view",
    text: "Your dashboard highlights bookings, due tasks, overdue invoices, and expiring documents so you know what needs attention first.",
    icon: LayoutDashboard,
  },
  {
    title: "Add your business records",
    text: "Use the sidebar modules to add customers, services, employees, bookings, tasks, invoices, payments, expenses, and documents.",
    icon: ListChecks,
  },
  {
    title: "Watch the dashboard come alive",
    text: "Comvexa turns your records into revenue totals, activity feed updates, setup progress, business health, and recent-work panels.",
    icon: BarChart3,
  },
  {
    title: "Customize your workspace",
    text: "Open Settings to adjust company name, currency, timezone, accent color, density, sidebar style, and visible modules.",
    icon: Settings,
  },
];

function markTutorialComplete() {
  window.localStorage.setItem(tutorialStorageKey, "true");
  window.localStorage.setItem(tutorialAutoShownKey, "true");
}

function markTutorialAutoShown() {
  window.localStorage.setItem(tutorialAutoShownKey, "true");
}

export function openFirstPlanTutorial() {
  window.dispatchEvent(new Event("comvexa-open-first-plan-tutorial"));
}

export function FirstPlanTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    function openOnFirstUnlock() {
      const completed = window.localStorage.getItem(tutorialStorageKey) === "true";
      const alreadyShown = window.localStorage.getItem(tutorialAutoShownKey) === "true";

      if (!completed && !alreadyShown) {
        markTutorialAutoShown();
        setStepIndex(0);
        setIsOpen(true);
      }
    }

    function openTutorial() {
      markTutorialAutoShown();
      setStepIndex(0);
      setIsOpen(true);
    }

    window.addEventListener(firstPlanUnlockedEvent, openOnFirstUnlock);
    window.addEventListener("comvexa-open-first-plan-tutorial", openTutorial);

    return () => {
      window.removeEventListener(firstPlanUnlockedEvent, openOnFirstUnlock);
      window.removeEventListener("comvexa-open-first-plan-tutorial", openTutorial);
    };
  }, []);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        markTutorialAutoShown();
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", closeOnEscape);
    }

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const step = steps[stepIndex];
  const Icon = step.icon;
  const isLastStep = stepIndex === steps.length - 1;

  function finishTutorial() {
    markTutorialComplete();
    setIsOpen(false);
  }

  function closeTutorial() {
    markTutorialAutoShown();
    setIsOpen(false);
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[#172523]/70 p-4 backdrop-blur-md sm:p-6">
      <section className="comvexa-tutorial-v3 relative max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/60 bg-[#f7f5ef] shadow-2xl shadow-slate-950/30 sm:max-h-[calc(100dvh-3rem)]" role="dialog" aria-modal="true" aria-label="Welcome to your Comvexa workspace">
        <div className="absolute -right-20 -top-20 size-56 rounded-full bg-violet-200/50 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-20 size-64 rounded-full bg-emerald-200/50 blur-3xl" aria-hidden="true" />

        <div className="relative max-h-[calc(100dvh-2rem)] min-h-0 overflow-y-auto sm:max-h-[calc(100dvh-3rem)]">
          <aside className="border-b border-[#dedbd1] bg-white/55 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#e9e5ff] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#554cae] ring-1 ring-[#d9d3ff]">
                <Sparkles size={16} />
                Workspace launch guide
              </p>
              <button
                type="button"
                onClick={closeTutorial}
                className="grid size-9 place-items-center rounded-xl border border-[#dedbd1] bg-white text-[#69665e] hover:bg-[#f2f0ea]"
                aria-label="Close tutorial"
              >
                <X size={18} />
              </button>
            </div>

            <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-[#20231f] sm:text-3xl">
              Your first four moves in Comvexa
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d7069]">
              A short launch map for turning an empty workspace into a useful daily operating system.
            </p>

            <div className="mt-5 grid grid-cols-4 gap-2">
              {steps.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setStepIndex(index)}
                  className={`group min-w-0 rounded-xl border p-2.5 text-left transition sm:p-3 ${
                    index === stepIndex
                      ? "border-[#5d54b8] bg-[#5d54b8] text-white shadow-md shadow-violet-200"
                      : "border-[#dedbd1] bg-white/70 text-[#77756e] hover:border-[#bbb5e5]"
                  }`}
                >
                  <span
                    className={`grid size-7 place-items-center rounded-lg text-xs font-bold ${
                      index === stepIndex ? "bg-white/15 text-white" : "bg-[#eeece5] text-[#747169]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="mt-2 hidden truncate text-[10px] font-semibold sm:block">{item.title}</span>
                </button>
              ))}
            </div>
          </aside>

          <div key={step.title} className="min-h-0 p-5 sm:p-7" aria-live="polite">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-[#e4f2e9] text-[#277156] ring-1 ring-[#cee5d7]"><Icon size={21} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#77756e]">Step {stepIndex + 1} of {steps.length}</p><p className="mt-1 text-xs font-semibold text-[#277156]">About 30 seconds</p></div></div>
              <div className="flex gap-1.5">{steps.map((item, index) => <span key={item.title} className={`h-1.5 rounded-full transition-all ${index === stepIndex ? "w-8 bg-[#5d54b8]" : index < stepIndex ? "w-3 bg-[#8dc4aa]" : "w-3 bg-[#d8d5cd]"}`} />)}</div>
            </div>

            <h3 className="mt-5 text-2xl font-semibold tracking-tight text-[#20231f]">
              {step.title}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#636760] sm:text-base sm:leading-7">
              {step.text}
            </p>

            <div className="mt-5 rounded-2xl border border-[#d7e7dc] bg-[#edf6f0] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#277156]" size={19} />
                <div>
                  <p className="text-sm font-semibold text-[#22332d]">Recommended first flow</p>
                  <p className="mt-2 text-xs leading-5 text-[#617269] sm:text-sm sm:leading-6">
                    Add customers, create services, invite employees, create an
                    invoice, then record a payment. After that, your dashboard
                    metrics and activity feed start feeling genuinely useful.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={finishTutorial}
                className="text-xs font-semibold text-[#77756e] hover:text-[#20231f]"
              >
                Skip and don&apos;t show again
              </button>

              <div className="flex gap-3">
                {stepIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStepIndex((current) => current - 1)}
                    className="rounded-xl border border-[#d8d5cd] bg-white px-4 py-2.5 text-sm font-semibold text-[#555750] hover:bg-[#f2f0ea]"
                  >
                    Back
                  </button>
                ) : null}
                {isLastStep ? (
                  <Link
                    href="/dashboard/customers"
                    onClick={finishTutorial}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5d54b8] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:bg-[#4e46a2]"
                  >
                    Add first customer
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStepIndex((current) => current + 1)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5d54b8] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:bg-[#4e46a2]"
                  >
                    Next
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
