"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BadgeCheck,
  Bot,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  CalendarClock,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  HandCoins,
  FileText,
  GitBranch,
  Home,
  ListChecks,
  LineChart,
  MessageSquareText,
  Package,
  ReceiptText,
  Repeat,
  Settings,
  ShieldCheck,
  ShoppingCart,
  ScrollText,
  UploadCloud,
  Users,
  WalletCards,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { hasOwnerDashboardAccess } from "@/src/lib/admin/access";
import { supabase } from "@/src/lib/supabase/client";
import { canUseModule, defaultPlan, normalizePlan, planModules, type PlanName } from "./plan-access";
import { enableOwnerPlanAccess, formatTrialRemaining, getProTrialStatus, isOwnerPlanAccessActiveFor, isPaymentSetupComplete } from "./payment-status";
import { useDashboardText } from "./dashboard-i18n";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home, group: "Workspace" },
  { label: "Customers", href: "/dashboard/customers", icon: Users, group: "Operations" },
  { label: "Employees", href: "/dashboard/employees", icon: BriefcaseBusiness, group: "Operations" },
  { label: "Staff Schedules", href: "/dashboard/staff-schedules", icon: CalendarClock, group: "Operations" },
  { label: "Services", href: "/dashboard/services", icon: Package, group: "Operations" },
  { label: "Bookings", href: "/dashboard/bookings", icon: CalendarDays, group: "Operations" },
  { label: "Tasks", href: "/dashboard/tasks", icon: ListChecks, group: "Operations" },
  { label: "Time & Attendance", href: "/dashboard/time-attendance", icon: CalendarClock, group: "Operations" },
  { label: "Invoices", href: "/dashboard/invoices", icon: ReceiptText, group: "Finance" },
  { label: "Recurring Invoices", href: "/dashboard/recurring-invoices", icon: Repeat, group: "Finance" },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard, group: "Finance" },
  { label: "Expenses", href: "/dashboard/expenses", icon: HandCoins, group: "Finance" },
  { label: "Supplier Bills", href: "/dashboard/supplier-bills", icon: ScrollText, group: "Finance" },
  { label: "Purchase Orders", href: "/dashboard/purchase-orders", icon: ShoppingCart, group: "Finance" },
  { label: "Documents", href: "/dashboard/documents", icon: FileText, group: "Assets" },
  { label: "Inventory", href: "/dashboard/inventory", icon: Boxes, group: "Assets" },
  { label: "Branches", href: "/dashboard/branches", icon: GitBranch, group: "Assets" },
  { label: "Customer Portal", href: "/dashboard/customer-portal", icon: Users, group: "Assets" },
  { label: "Branch Analytics", href: "/dashboard/branch-analytics", icon: LineChart, group: "Assets" },
  { label: "WhatsApp Templates", href: "/dashboard/whatsapp-templates", icon: MessageSquareText, group: "Control" },
  { label: "Permissions", href: "/dashboard/permissions", icon: ShieldCheck, group: "Control" },
  { label: "AI Assistant", href: "/dashboard/ai-assistant", icon: Bot, group: "Control" },
  { label: "Automations", href: "/dashboard/automations", icon: Workflow, group: "Control" },
  { label: "Audit Logs", href: "/dashboard/audit-logs", icon: ScrollText, group: "Control" },
  { label: "Approvals", href: "/dashboard/approvals", icon: ClipboardCheck, group: "Control" },
  { label: "White Label", href: "/dashboard/white-label", icon: BadgeCheck, group: "Control" },
  { label: "Data Import", href: "/dashboard/data-import", icon: UploadCloud, group: "Control" },
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
    return Array.isArray(settings?.modules)
      ? Array.from(new Set([...(settings.modules as string[]), ...defaultVisibleModules]))
      : defaultVisibleModules;
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Workspace", "Operations"]);

  useEffect(() => {
    async function loadState() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (hasOwnerDashboardAccess(sessionData.session?.user.email)) {
        enableOwnerPlanAccess(window.localStorage.getItem("comvexa-selected-plan"), "monthly", sessionData.session?.user.email);
      }

      const sessionEmail = sessionData.session?.user.email?.trim().toLowerCase();
      setPlan(normalizePlan(window.localStorage.getItem("comvexa-selected-plan")));
      setAccessActive(isOwnerPlanAccessActiveFor(sessionEmail) || isPaymentSetupComplete() || getProTrialStatus().active);
      const trial = getProTrialStatus();
      setTrialLabel(trial.active ? formatTrialRemaining(trial.remainingMs) : "");
      setVisibleModules(readWorkspaceModules());
    }

    const timeout = window.setTimeout(() => void loadState(), 0);
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
      })).filter((group) => group.items.length > 0),
    [accessActive, plan, visibleModules],
  );
  const mobileItems = navGroups.flatMap((group) => group.items);
  const mobilePrimaryLabels = accessActive
    ? ["Dashboard", "Customers", "Invoices", "Payments", "Settings"]
    : ["Subscription", "Settings"];
  const mobilePrimaryItems = mobilePrimaryLabels
    .map((label) => mobileItems.find((item) => item.label === label))
    .filter((item): item is (typeof navItems)[number] => Boolean(item));

  return (
    <>
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 shadow-2xl shadow-slate-950/10 backdrop-blur-xl lg:hidden">
      {mobilePrimaryItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : item.href !== "#" && pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
              isActive
                ? "bg-[var(--comvexa-accent-soft,#eff6ff)] text-[var(--comvexa-accent,#2563eb)]"
                : "text-slate-500"
            }`}
          >
            <Icon size={18} />
            <span className="max-w-full truncate">{navLabel(item.label)}</span>
          </Link>
        );
      })}
    </nav>
    <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3 [scrollbar-width:thin]">
      {navGroups.map((group) => {
        const groupHasActiveItem = group.items.some((item) =>
          item.href === "/dashboard" ? pathname === item.href : item.href !== "#" && pathname.startsWith(item.href),
        );
        const groupExpanded = expandedGroups.includes(group.title) || groupHasActiveItem;

        return (
        <div key={group.title} className="rounded-xl border border-transparent">
          <button
            type="button"
            onClick={() =>
              setExpandedGroups((current) =>
                current.includes(group.title)
                  ? current.filter((title) => title !== group.title)
                  : [...current, group.title],
              )
            }
            className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--comvexa-sidebar-muted,#bfdbfe)] hover:bg-white/5"
            aria-expanded={groupExpanded}
          >
            <span>{groupLabel(group.title)}</span>
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] tracking-normal text-[var(--comvexa-sidebar-title,#ffffff)]">
                {group.items.length}
              </span>
              <ChevronDown size={14} className={`transition ${groupExpanded ? "rotate-180" : ""}`} />
            </span>
          </button>
          {groupExpanded ? (
          <div className="mt-1 space-y-0.5">
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
            className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--comvexa-nav-active-bg,#ffffff)] text-[var(--comvexa-nav-active-text,#0f172a)] shadow-sm ring-1 ring-[var(--comvexa-sidebar-border,rgba(255,255,255,0.10))]"
                : "text-[var(--comvexa-sidebar-muted,#bfdbfe)] hover:bg-[var(--comvexa-nav-hover-bg,rgba(255,255,255,0.08))] hover:text-[var(--comvexa-sidebar-title,#ffffff)]"
            }`}
          >
            <span
              className={`flex size-7 items-center justify-center rounded-md ${
                isActive ? "bg-[var(--comvexa-accent,#2563eb)] text-white" : "bg-[var(--comvexa-sidebar-card,rgba(255,255,255,0.06))] text-[var(--comvexa-sidebar-muted,#bfdbfe)] group-hover:text-[var(--comvexa-sidebar-title,#ffffff)]"
              }`}
            >
              <Icon size={15} strokeWidth={2.2} />
            </span>
            <span className="min-w-0 truncate">{navLabel(item.label)}</span>
          </Link>
        );
      })}
          </div>
          ) : null}
        </div>
        );
      })}
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
  return String(planModules[plan].length);
}
