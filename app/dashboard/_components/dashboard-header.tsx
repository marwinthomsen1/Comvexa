"use client";

import { Search, ShieldCheck } from "lucide-react";
import { DashboardAccount } from "./dashboard-account";
import { useDashboardText } from "./dashboard-i18n";

export function DashboardHeader() {
  const { text } = useDashboardText();

  return (
    <header className="sticky top-0 z-10 border-b px-6 py-4 backdrop-blur-xl comvexa-theme-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--comvexa-accent,#2563eb)]">
            {text.workspaceEyebrow}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-normal">
            {text.dashboardTitle}
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex h-11 min-w-72 items-center gap-3 rounded-lg border px-3 text-sm comvexa-theme-soft comvexa-theme-muted">
            <Search size={17} />
            <input
              type="search"
              placeholder={text.searchPlaceholder}
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>
          <span className="inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-[var(--comvexa-accent,#2563eb)] ring-1 comvexa-theme-soft">
            <ShieldCheck size={17} />
            {text.workspaceReady}
          </span>
          <DashboardAccount />
        </div>
      </div>
    </header>
  );
}
