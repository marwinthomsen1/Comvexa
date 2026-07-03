"use client";

import { Search, ShieldCheck } from "lucide-react";
import { DashboardAccount } from "./dashboard-account";
import { useDashboardText } from "./dashboard-i18n";

export function DashboardHeader() {
  const { text } = useDashboardText();

  return (
    <header className="sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-xl comvexa-theme-surface sm:px-6 sm:py-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-[var(--comvexa-accent,#2563eb)] sm:text-xs">
              {text.workspaceEyebrow}
            </p>
            <h1 className="mt-0.5 truncate text-lg font-semibold tracking-normal sm:mt-1 sm:text-xl">
              {text.dashboardTitle}
            </h1>
          </div>
          <div className="shrink-0 sm:hidden">
            <DashboardAccount compact />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <label className="flex h-11 w-full items-center gap-3 rounded-lg border px-3 text-sm comvexa-theme-soft comvexa-theme-muted sm:min-w-72">
            <Search size={17} />
            <input
              type="search"
              placeholder={text.searchPlaceholder}
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>
          <span className="hidden h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-[var(--comvexa-accent,#2563eb)] ring-1 comvexa-theme-soft sm:inline-flex">
            <ShieldCheck size={17} />
            {text.workspaceReady}
          </span>
          <div className="hidden sm:block">
            <DashboardAccount />
          </div>
        </div>
      </div>
    </header>
  );
}
