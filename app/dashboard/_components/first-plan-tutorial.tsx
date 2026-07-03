"use client";

import { useEffect, useState } from "react";
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

      if (!completed) {
        setStepIndex(0);
        setIsOpen(true);
      }
    }

    function openTutorial() {
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
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", closeOnEscape);
    }

    return () => window.removeEventListener("keydown", closeOnEscape);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm sm:p-6">
      <section className="relative max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-hidden rounded-[1.5rem] border border-white/70 bg-white shadow-2xl shadow-slate-950/30 sm:max-h-[calc(100dvh-3rem)]">
        <div className="absolute -right-20 -top-20 size-56 rounded-full bg-amber-200/70 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 size-64 rounded-full bg-cyan-200/70 blur-3xl" />

        <div className="relative grid max-h-[calc(100dvh-2rem)] min-h-0 overflow-y-auto sm:max-h-[calc(100dvh-3rem)] lg:grid-cols-[0.9fr_1.1fr] lg:overflow-hidden">
          <aside className="min-h-0 bg-cyan-950 p-5 text-white sm:p-6 lg:overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-amber-100 ring-1 ring-white/15">
                <Sparkles size={16} />
                First plan unlocked
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/15"
                aria-label="Close tutorial"
              >
                <X size={18} />
              </button>
            </div>

            <h2 className="mt-6 max-w-md text-3xl font-semibold leading-tight tracking-normal">
              Welcome to your Comvexa workspace.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-cyan-50/75">
              This quick tour shows what to do first, where your daily work
              lives, and how the dashboard becomes smarter as you add records.
            </p>

            <div className="mt-6 grid gap-3">
              {steps.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setStepIndex(index)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left text-sm transition ${
                    index === stepIndex
                      ? "border-amber-200 bg-white text-slate-950"
                      : "border-white/10 bg-white/[0.07] text-cyan-50 hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                      index === stepIndex ? "bg-amber-100 text-cyan-950" : "bg-white/10 text-amber-100"
                    }`}
                  >
                    {index + 1}
                  </span>
                  {item.title}
                </button>
              ))}
            </div>
          </aside>

          <div className="min-h-0 p-5 sm:p-6 lg:overflow-y-auto lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                <Icon size={24} />
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                {stepIndex + 1} of {steps.length}
              </span>
            </div>

            <h3 className="mt-6 text-2xl font-semibold tracking-normal text-slate-950">
              {step.title}
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {step.text}
            </p>

            <div className="mt-6 rounded-2xl border border-cyan-100 bg-[#f7fbff] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-cyan-700" size={20} />
                <div>
                  <p className="font-semibold text-slate-950">Recommended first flow</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Add customers, create services, invite employees, create an
                    invoice, then record a payment. After that, your dashboard
                    metrics and activity feed start feeling genuinely useful.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={finishTutorial}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                Don&apos;t show again
              </button>

              <div className="flex gap-3">
                {stepIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStepIndex((current) => current - 1)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Back
                  </button>
                ) : null}
                {isLastStep ? (
                  <Link
                    href="/dashboard/customers"
                    onClick={finishTutorial}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6b4a] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 hover:bg-[#ff5633]"
                  >
                    Add first customer
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStepIndex((current) => current + 1)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6b4a] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 hover:bg-[#ff5633]"
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
    </div>
  );
}
