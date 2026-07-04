"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  CalendarClock,
  CreditCard,
  HandCoins,
  FileText,
  GitBranch,
  Home,
  ListChecks,
  MessageSquareText,
  Package,
  ReceiptText,
  Repeat,
  Settings,
  ShieldCheck,
  ScrollText,
  Users,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { canUseModule, defaultPlan, normalizePlan, type PlanName } from "./plan-access";
import { formatTrialRemaining, getProTrialStatus, isWorkspaceAccessActive } from "./payment-status";
import { useDashboardText } from "./dashboard-i18n";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home, group: "Workspace" },
  { label: "Customers", href: "/dashboard/customers", icon: Users, group: "Operations" },
  { label: "Employees", href: "/dashboard/employees", icon: BriefcaseBusiness, group: "Operations" },
  { label: "Staff Schedules", href: "/dashboard/staff-schedules", icon: CalendarClock, group: "Operations" },
  { label: "Services", href: "/dashboard/services", icon: Package, group: "Operations" },
  { label: "Bookings", href: "/dashboard/bookings", icon: CalendarDays, group: "Operations" },
  { label: "Tasks", href: "/dashboard/tasks", icon: ListChecks, group: "Operations" },
  { label: "Invoices", href: "/dashboard/invoices", icon: ReceiptText, group: "Finance" },
  { label: "Recurring Invoices", href: "/dashboard/recurring-invoices", icon: Repeat, group: "Finance" },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard, group: "Finance" },
  { label: "Expenses", href: "/dashboard/expenses", icon: HandCoins, group: "Finance" },
  { label: "Supplier Bills", href: "/dashboard/supplier-bills", icon: ScrollText, group: "Finance" },
  { label: "Documents", href: "/dashboard/documents", icon: FileText, group: "Assets" },
  { label: "Inventory", href: "/dashboard/inventory", icon: Boxes, group: "Assets" },
  { label: "Branches", href: "/dashboard/branches", icon: GitBranch, group: "Assets" },
  { label: "WhatsApp Templates", href: "/dashboard/whatsapp-templates", icon: MessageSquareText, group: "Control" },
  { label: "Permissions", href: "/dashboard/permissions", icon: ShieldCheck, group: "Control" },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3, group: "Control" },
  { label: "Subscription", href: "/dashboard/subscription", icon: WalletCards, group: "Control" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, group: "Control" },
];

const alwaysVisibleModules = ["Dashboard", "Subscription", "Settings"];
const defaultVisibleModules = navItems.map((item) => item.label);

function readWorkspaceModules() {
  try {
    const saved = window.localStorage.getItem("comvexa-workspace-settings");
    const settings = saved ? JSON.parse(saved) : null;
    return Array.isArray(settings?.modules) ? settings.modules as string[] : defaultVisibleModules;
  } catch {
    return defaultVisibleModules;
  }
}

export function DashboardNav() {
  const pathname = usePathname();
  const { text, navLabel, groupLabel } = useDashboardText();
  const [plan, setPlan] = useState<PlanName>(defaultPlan);
  const [accessActive, setAccessActive] = useState(false);
  const [trialLabel, setTrialLabel] = useState("");
  const [visibleModules, setVisibleModules] = useState<string[]>(defaultVisibleModules);

  useEffect(() => {
    function loadState() {
      setPlan(normalizePlan(window.localStorage.getItem("comvexa-selected-plan")));
      setAccessActive(isWorkspaceAccessActive());
      const trial = getProTrialStatus();
      setTrialLabel(trial.active ? formatTrialRemaining(trial.remainingMs) : "");
      setVisibleModules(readWorkspaceModules());
    }

    const timeout = window.setTimeout(loadState, 0);
    window.addEventListener("storage", loadState);
    window.addEventListener("comvexa-plan-change", loadState);
    window.addEventListener("comvexa-settings-change", loadState);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("storage", loadState);
      window.removeEventListener("comvexa-plan-change", loadState);
      window.removeEventListener("comvexa-settings-change", loadState);
    };
  }, []);

  const navGroups = useMemo(
    () =>
      [
        { title: "Workspace", items: navItems.filter((item) => item.group === "Workspace") },
        { title: "Operations", items: navItems.filter((item) => item.group === "Operations") },
        { title: "Finance", items: navItems.filter((item) => item.group === "Finance") },
        { title: "Assets", items: navItems.filter((item) => item.group === "Assets") },
        { title: "Control", items: navItems.filter((item) => item.group === "Control") },
      ].map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!accessActive) {
            return ["Subscription", "Settings"].includes(item.label);
          }

          if (!alwaysVisibleModules.includes(item.label) && !visibleModules.includes(item.label)) {
            return false;
          }

          return canUseModule(plan, item.label);
        }),
      })),
    [accessActive, plan, visibleModules],
  );
  const mobileItems = navGroups.flatMap((group) => group.items);

  return (
    <>
    <nav className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] lg:hidden">
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : item.href !== "#" && pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1 transition ${
              isActive
                ? "bg-white text-slate-950 ring-white/30"
                : "bg-white/10 text-[var(--comvexa-sidebar-muted,#bfdbfe)] ring-white/10"
            }`}
          >
            <Icon size={15} />
            {navLabel(item.label)}
          </Link>
        );
      })}
    </nav>
    <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
      {navGroups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--comvexa-sidebar-muted,#bfdbfe)]">
            {groupLabel(group.title)}
          </p>
          <div className="space-y-1">
      {group.items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : item.href !== "#" && pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--comvexa-nav-active-bg,#ffffff)] text-[var(--comvexa-nav-active-text,#0f172a)] shadow-sm ring-1 ring-[var(--comvexa-sidebar-border,rgba(255,255,255,0.10))]"
                : "text-[var(--comvexa-sidebar-muted,#bfdbfe)] hover:bg-[var(--comvexa-nav-hover-bg,rgba(255,255,255,0.08))] hover:text-[var(--comvexa-sidebar-title,#ffffff)]"
            }`}
          >
            <span
              className={`flex size-8 items-center justify-center rounded-md ${
                isActive ? "bg-[var(--comvexa-accent,#2563eb)] text-white" : "bg-[var(--comvexa-sidebar-card,rgba(255,255,255,0.06))] text-[var(--comvexa-sidebar-muted,#bfdbfe)] group-hover:text-[var(--comvexa-sidebar-title,#ffffff)]"
              }`}
            >
              <Icon size={16} strokeWidth={2.2} />
            </span>
            {navLabel(item.label)}
          </Link>
        );
      })}
          </div>
        </div>
      ))}
      </nav>
      <div className="shrink-0 border-t border-[var(--comvexa-sidebar-border,rgba(255,255,255,0.10))] px-3 py-3">
        <div className="rounded-2xl border border-[var(--comvexa-sidebar-border,rgba(255,255,255,0.10))] bg-[var(--comvexa-sidebar-card,rgba(255,255,255,0.06))] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-[var(--comvexa-sidebar-muted,#bfdbfe)] ring-1 ring-white/10">
                <Bell size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--comvexa-sidebar-title,#ffffff)]">
                  {trialLabel ? text.trial : accessActive ? `${plan} ${text.plan}` : text.setupRequired}
                </p>
                <p className="text-xs text-[var(--comvexa-sidebar-muted,#bfdbfe)]">
                  {trialLabel || (accessActive ? `${planModulesCount(plan)} ${text.modules}` : text.paymentOrTrialRequired)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-slate-200/30">
            <div
              className="h-1.5 rounded-full bg-[var(--comvexa-accent,#2563eb)]"
              style={{
                width: !accessActive ? "20%" : plan === "Basic" ? "48%" : plan === "Pro" ? "74%" : "100%",
              }}
            />
          </div>
          <Link
            href={accessActive ? "/dashboard/settings" : "/dashboard/subscription"}
            className="mt-3 flex w-full items-center justify-center rounded-lg bg-[var(--comvexa-accent,#2563eb)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
          >
            {accessActive ? text.customize : trialLabel ? "Open dashboard" : "Choose plan"}
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

function planModulesCount(plan: PlanName) {
  if (plan === "Basic") {
    return "10";
  }

  if (plan === "Pro") {
    return "13";
  }

  return "20";
}
