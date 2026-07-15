"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import { DashboardAccount } from "./dashboard-account";
import { useDashboardText } from "./dashboard-i18n";
import { canUseModule } from "./plan-access";
import { loadSubscriptionAccess } from "./subscription-access";
import { supabase } from "@/src/lib/supabase/client";

const dashboardPages = [
  ["/dashboard/subscription/payment", "Subscription payment"],
  ["/dashboard/whatsapp-templates", "WhatsApp Templates"],
  ["/dashboard/recurring-invoices", "Recurring Invoices"],
  ["/dashboard/time-attendance", "Time & Attendance"],
  ["/dashboard/staff-schedules", "Staff Schedules"],
  ["/dashboard/branch-analytics", "Branch Analytics"],
  ["/dashboard/customer-portal", "Customer Portal"],
  ["/dashboard/purchase-orders", "Purchase Orders"],
  ["/dashboard/ai-assistant", "AI Assistant"],
  ["/dashboard/supplier-bills", "Supplier Bills"],
  ["/dashboard/audit-logs", "Audit Logs"],
  ["/dashboard/data-import", "Data Import"],
  ["/dashboard/white-label", "White Label"],
  ["/dashboard/subscription", "Subscription"],
  ["/dashboard/automations", "Automations"],
  ["/dashboard/permissions", "Permissions"],
  ["/dashboard/approvals", "Approvals"],
  ["/dashboard/documents", "Documents"],
  ["/dashboard/inventory", "Inventory"],
  ["/dashboard/employees", "Employees"],
  ["/dashboard/customers", "Customers"],
  ["/dashboard/bookings", "Bookings"],
  ["/dashboard/invoices", "Invoices"],
  ["/dashboard/payments", "Payments"],
  ["/dashboard/expenses", "Expenses"],
  ["/dashboard/services", "Services"],
  ["/dashboard/branches", "Branches"],
  ["/dashboard/reports", "Reports"],
  ["/dashboard/settings", "Settings"],
  ["/dashboard/tasks", "Tasks"],
  ["/dashboard", "Overview"],
] as const;

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { text, navLabel } = useDashboardText();
  const [search, setSearch] = useState("");
  const [searchablePages, setSearchablePages] = useState<ReadonlyArray<(typeof dashboardPages)[number]>>(dashboardPages);

  useEffect(() => {
    async function syncSearchablePages() {
      let visibleModules: string[] | null = null;
      try {
        const saved = window.localStorage.getItem("comvexa-workspace-settings");
        const settings = saved ? JSON.parse(saved) : null;
        visibleModules = Array.isArray(settings?.modules) ? settings.modules : null;
      } catch {
        visibleModules = null;
      }

      const access = await loadSubscriptionAccess();
      setSearchablePages(
        dashboardPages.filter(([, label]) => {
          const moduleName = label === "Overview" ? "Dashboard" : label === "Subscription payment" ? "Subscription" : label;
          const alwaysAvailable = ["Dashboard", "Subscription", "Settings"].includes(moduleName);
          return (alwaysAvailable || !visibleModules || visibleModules.includes(moduleName)) && canUseModule(access.plan, moduleName);
        }),
      );
    }

    void syncSearchablePages();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void syncSearchablePages(), 0);
    });
    window.addEventListener("storage", syncSearchablePages);
    window.addEventListener("comvexa-plan-change", syncSearchablePages);
    window.addEventListener("comvexa-settings-change", syncSearchablePages);
    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener("storage", syncSearchablePages);
      window.removeEventListener("comvexa-plan-change", syncSearchablePages);
      window.removeEventListener("comvexa-settings-change", syncSearchablePages);
    };
  }, []);

  const currentPage = useMemo(
    () => dashboardPages.find(([href]) => href === "/dashboard" ? pathname === href : pathname.startsWith(href)) ?? dashboardPages.at(-1)!,
    [pathname],
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = search.trim().toLowerCase();

    if (!term) {
      return;
    }

    const match = searchablePages.find(([, label]) => label.toLowerCase().includes(term));
    if (match) {
      router.push(match[0]);
      setSearch("");
    }
  }

  return (
    <header className="comvexa-dashboard-header sticky top-0 z-20 border-b border-[var(--comvexa-border,#d8e2dc)] bg-[color-mix(in_srgb,var(--comvexa-surface,#fffefa)_88%,transparent)] px-3 py-2.5 backdrop-blur-xl sm:px-5 lg:px-6">
      <div className="mx-auto flex min-h-12 max-w-[1500px] items-center gap-3 lg:min-h-14">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5 lg:hidden" aria-label="Comvexa dashboard home">
          <span className="grid size-10 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-[var(--comvexa-border,#d8e2dc)]">
            <Image src="/logo.png" alt="" width={40} height={40} className="size-full object-contain p-1" priority />
          </span>
          <span className="hidden font-black tracking-[-0.04em] text-[var(--comvexa-text,#073d47)] sm:block">Comvexa</span>
        </Link>

        <div className="min-w-0 flex-1 lg:flex-none lg:min-w-44">
          <p className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--comvexa-muted,#5d7477)] lg:block">
            {text.workspaceEyebrow}
          </p>
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-black tracking-[-0.035em] text-[var(--comvexa-text,#073d47)] sm:text-lg lg:mt-0.5 lg:text-xl">
              {navLabel(currentPage[1])}
            </h1>
            <span className="hidden size-1.5 rounded-full bg-[var(--comvexa-success,#0c8b84)] sm:block" aria-hidden="true" />
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative hidden min-w-0 flex-1 md:block">
          <label className="mx-auto flex h-11 max-w-xl items-center gap-3 rounded-2xl border border-[var(--comvexa-border,#d8e2dc)] bg-[var(--comvexa-soft-surface,#eef9f5)] px-4 text-sm text-[var(--comvexa-muted,#5d7477)] transition focus-within:border-[var(--comvexa-accent,#0c8b84)] focus-within:bg-[var(--comvexa-surface,#fffefa)] focus-within:ring-4 focus-within:ring-[var(--comvexa-accent-soft,#dffff8)]">
            <Search size={17} className="shrink-0" />
            <span className="sr-only">Search dashboard modules</span>
            <input
              type="search"
              list="comvexa-dashboard-pages"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Jump to a module..."
              className="min-w-0 flex-1 bg-transparent text-[var(--comvexa-text,#073d47)] outline-none placeholder:text-[var(--comvexa-muted,#5d7477)]"
            />
            <button type="submit" className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--comvexa-surface,#fffefa)] text-[var(--comvexa-muted,#5d7477)] ring-1 ring-[var(--comvexa-border,#d8e2dc)]" aria-label="Open matching module">
              <ArrowRight size={14} />
            </button>
          </label>
          <datalist id="comvexa-dashboard-pages">
            {searchablePages.map(([href, label]) => <option key={href} value={label} />)}
          </datalist>
        </form>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden h-9 items-center gap-2 rounded-full border border-[var(--comvexa-border,#d8e2dc)] bg-[var(--comvexa-soft-surface,#eef9f5)] px-3 text-xs font-bold text-[var(--comvexa-success,#0c8b84)] xl:inline-flex">
            <ShieldCheck size={14} />
            {text.workspaceReady}
          </span>
          <DashboardAccount compact />
        </div>
      </div>
    </header>
  );
}
