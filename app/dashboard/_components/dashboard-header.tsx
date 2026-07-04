"use client";

import { Search, ShieldCheck } from "lucide-react";
import { DashboardAccount } from "./dashboard-account";
import { useDashboardText } from "./dashboard-i18n";

export function DashboardHeader() {
  const { text } = useDashboardText();

  return (
    <header className="sticky top-0 z-10 border-b px-3 py-3 backdrop-blur-xl comvexa-theme-surface sm:px-6 sm:py-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="rounded-xl border border-[var(--comvexa-border,#dbeafe)] bg-[var(--comvexa-soft-surface,#f7fbff)] p-3 text-[var(--comvexa-text,#020617)] shadow-lg shadow-slate-950/5 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 pt-0.5">
              <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-[var(--comvexa-accent,#2563eb)] sm:text-xs">
                {text.workspaceEyebrow}
              </p>
              <h1 className="mt-0.5 truncate text-xl font-semibold tracking-normal sm:mt-1 sm:text-xl">
                {text.dashboardTitle}
              </h1>
            </div>
            <div className="shrink-0 sm:hidden">
              <DashboardAccount compact />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2 sm:hidden">
            <label className="flex h-11 min-w-0 items-center gap-2 rounded-lg border px-3 text-sm comvexa-theme-surface comvexa-theme-muted">
              <Search size={17} className="shrink-0 text-[var(--comvexa-accent,#2563eb)]" />
              <input
                type="search"
                placeholder={text.searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
              />
            </label>
            <span className="inline-flex h-11 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold text-[var(--comvexa-accent,#2563eb)] comvexa-theme-surface">
              <ShieldCheck size={15} />
              <span className="sr-only">{text.workspaceReady}</span>
            </span>
          </div>
        </div>
        <div className="hidden min-w-0 flex-col gap-2 sm:flex sm:flex-row sm:items-center sm:gap-3 xl:flex-1 xl:justify-end">
          <label className="flex h-11 w-full min-w-0 max-w-lg items-center gap-3 rounded-lg border px-3 text-sm comvexa-theme-soft comvexa-theme-muted sm:min-w-60 xl:min-w-80">
            <Search size={17} />
            <input
              type="search"
              placeholder={text.searchPlaceholder}
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>
          <span className="hidden h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 text-xs font-semibold text-[var(--comvexa-accent,#2563eb)] ring-1 comvexa-theme-soft md:inline-flex">
            <ShieldCheck size={14} />
            <span>{text.workspaceReady}</span>
          </span>
          <div className="hidden shrink-0 sm:block">
            <DashboardAccount />
          </div>
        </div>
      </div>
    </header>
  );
}
