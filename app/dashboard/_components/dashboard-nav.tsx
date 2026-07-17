"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Menu,
  Package,
  Plus,
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
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { canUseModule, defaultPlan, planModules, type PlanName } from "./plan-access";
import { formatTrialRemaining } from "./payment-status";
import { invalidateSubscriptionAccess, loadSubscriptionAccess, type SubscriptionAccess } from "./subscription-access";
import { useDashboardText } from "./dashboard-i18n";
import { supabase } from "@/src/lib/supabase/client";

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
      ? Array.from(new Set([...(settings.modules as string[]), ...alwaysVisibleModules]))
      : defaultVisibleModules;
  } catch {
    return defaultVisibleModules;
  }
}

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { text, navLabel, groupLabel } = useDashboardText();
  const [plan, setPlan] = useState<PlanName>(defaultPlan);
  const [accessActive, setAccessActive] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [trialLabel, setTrialLabel] = useState("");
  const [visibleModules, setVisibleModules] = useState<string[]>(defaultVisibleModules);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Workspace", "Operations"]);
  const [mobilePanel, setMobilePanel] = useState<"create" | "more" | null>(null);

  useEffect(() => {
    async function loadState(force = false) {
      try {
        const access = await loadSubscriptionAccess({ force });
        setPlan(access.plan);
        setAccessActive(access.accessActive);
        const remainingMs = access.trialEndsAt ? new Date(access.trialEndsAt).getTime() - Date.now() : 0;
        setTrialLabel(access.trialActive ? formatTrialRemaining(remainingMs) : "");
        setVisibleModules(readWorkspaceModules());
        window.dispatchEvent(new CustomEvent<SubscriptionAccess>("comvexa-subscription-sync", { detail: access }));
      } finally {
        setAccessLoading(false);
      }
    }

    function refreshState() {
      invalidateSubscriptionAccess();
      void loadState(true);
    }

    function loadCachedState() {
      void loadState(false);
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        refreshState();
      }
    }

    const timeout = window.setTimeout(() => void loadState(true), 0);
    const poll = window.setInterval(refreshWhenVisible, 15_000);
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void loadState(true), 0);
    });
    window.addEventListener("focus", refreshState);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("storage", loadCachedState);
    window.addEventListener("comvexa-plan-change", refreshState);
    window.addEventListener("comvexa-settings-change", loadCachedState);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(poll);
      authListener.subscription.unsubscribe();
      window.removeEventListener("focus", refreshState);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("storage", loadCachedState);
      window.removeEventListener("comvexa-plan-change", refreshState);
      window.removeEventListener("comvexa-settings-change", loadCachedState);
    };
  }, []);

  useEffect(() => {
    if (!mobilePanel) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobilePanel(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobilePanel]);

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
  const mobileHomeItem = mobileItems.find((item) => item.label === "Dashboard");
  const mobileCustomerItem = mobileItems.find((item) => item.label === "Customers");
  const mobileInvoiceItem = mobileItems.find((item) => item.label === "Invoices");
  const lockedMobileItems = ["Subscription", "Settings"]
    .map((label) => mobileItems.find((item) => item.label === label))
    .filter((item): item is (typeof navItems)[number] => Boolean(item));
  const quickActionItems = ["Customers", "Tasks", "Invoices", "Payments", "Bookings", "Documents"]
    .map((label) => mobileItems.find((item) => item.label === label))
    .filter((item): item is (typeof navItems)[number] => Boolean(item));

  useEffect(() => {
    if (!accessActive) return;
    const hrefs = navGroups.flatMap((group) => group.items.map((item) => item.href));
    const timers = hrefs.map((href, index) => window.setTimeout(() => router.prefetch(href), 150 + index * 60));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [accessActive, navGroups, router]);

  return (
    <>
    <nav aria-label="Mobile dashboard" className={`comvexa-mobile-nav fixed inset-x-0 bottom-0 z-40 grid ${accessActive ? "grid-cols-5" : "grid-cols-3"} border-t border-[var(--comvexa-border,#d8e2dc)] bg-[color-mix(in_srgb,var(--comvexa-surface,#fffefa)_94%,transparent)] px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_35px_rgba(7,61,71,0.10)] backdrop-blur-xl lg:hidden`}>
      {accessActive ? (
        <>
          {mobileHomeItem ? <MobileNavLink item={mobileHomeItem} pathname={pathname} label={navLabel(mobileHomeItem.label)} /> : null}
          {mobileCustomerItem ? <MobileNavLink item={mobileCustomerItem} pathname={pathname} label={navLabel(mobileCustomerItem.label)} /> : null}
          <button type="button" onClick={() => setMobilePanel("create")} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1 text-[10px] font-bold text-[var(--comvexa-text,#073d47)]">
            <span className="-mt-5 grid size-12 place-items-center rounded-2xl bg-[var(--comvexa-text,#073d47)] text-white shadow-[0_10px_24px_rgba(7,61,71,0.24)] ring-4 ring-[var(--comvexa-surface,#fffefa)]"><Plus size={21} /></span>
            <span>Create</span>
          </button>
          {mobileInvoiceItem ? <MobileNavLink item={mobileInvoiceItem} pathname={pathname} label={navLabel(mobileInvoiceItem.label)} /> : null}
          <button type="button" onClick={() => setMobilePanel("more")} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-bold text-[var(--comvexa-muted,#5d7477)]">
            <Menu size={19} />
            <span>More</span>
          </button>
        </>
      ) : (
        <>
          {lockedMobileItems.map((item) => <MobileNavLink key={item.label} item={item} pathname={pathname} label={navLabel(item.label)} />)}
          <button type="button" onClick={() => setMobilePanel("more")} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-bold text-[var(--comvexa-muted,#5d7477)]">
            <Menu size={19} />
            <span>More</span>
          </button>
        </>
      )}
    </nav>

    {mobilePanel ? (
      <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={mobilePanel === "create" ? "Create menu" : "All dashboard modules"}>
        <button type="button" className="absolute inset-0 bg-[#052f37]/55 backdrop-blur-sm" onClick={() => setMobilePanel(null)} aria-label="Close menu" />
        <section className="absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-hidden rounded-t-[2rem] border-t border-[var(--comvexa-border,#d8e2dc)] bg-[var(--comvexa-surface,#fffefa)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--comvexa-border,#d8e2dc)] px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--comvexa-accent,#0c8b84)]">Comvexa workspace</p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-[var(--comvexa-text,#073d47)]">{mobilePanel === "create" ? "Create something new" : "All modules"}</h2>
            </div>
            <button type="button" onClick={() => setMobilePanel(null)} className="grid size-10 place-items-center rounded-2xl border border-[var(--comvexa-border,#d8e2dc)] text-[var(--comvexa-muted,#5d7477)]" aria-label="Close menu"><X size={18} /></button>
          </div>
          <div className="max-h-[calc(86dvh-5rem)] overflow-y-auto p-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
            {mobilePanel === "create" ? (
              <div className="grid grid-cols-2 gap-3">
                {quickActionItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.label} href={item.href} onClick={() => setMobilePanel(null)} className="rounded-2xl border border-[var(--comvexa-border,#d8e2dc)] bg-[var(--comvexa-soft-surface,#eef9f5)] p-4">
                      <span className="grid size-10 place-items-center rounded-xl bg-[var(--comvexa-accent-soft,#dffff8)] text-[var(--comvexa-accent,#0c8b84)]"><Icon size={18} /></span>
                      <span className="mt-4 block text-sm font-black text-[var(--comvexa-text,#073d47)]">New {navLabel(item.label).replace(/s$/, "")}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-5">
                {navGroups.map((group) => (
                  <div key={group.title}>
                    <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--comvexa-muted,#5d7477)]">{groupLabel(group.title)}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
                        return (
                          <Link key={item.label} href={item.href} onClick={() => setMobilePanel(null)} aria-current={isActive ? "page" : undefined} className={`flex min-w-0 items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-bold ${isActive ? "border-[var(--comvexa-accent,#0c8b84)] bg-[var(--comvexa-accent-soft,#dffff8)] text-[var(--comvexa-accent,#0c8b84)]" : "border-[var(--comvexa-border,#d8e2dc)] text-[var(--comvexa-text,#073d47)]"}`}>
                            <Icon size={17} className="shrink-0" />
                            <span className="truncate">{navLabel(item.label)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    ) : null}
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
            aria-current={isActive ? "page" : undefined}
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
                  {accessLoading ? "Checking access" : trialLabel ? text.trial : accessActive ? `${plan} ${text.plan}` : text.setupRequired}
                </p>
                <p className="text-xs text-[var(--comvexa-sidebar-muted,#bfdbfe)]">
                  {accessLoading ? "Loading workspace" : trialLabel || (accessActive ? `${planModulesCount(plan)} ${text.modules}` : text.paymentOrTrialRequired)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-slate-200/30">
            <div
              className="h-1.5 rounded-full bg-[var(--comvexa-accent,#2563eb)]"
              style={{
                width: accessLoading ? "36%" : !accessActive ? "20%" : plan === "Basic" ? "48%" : plan === "Pro" ? "74%" : "100%",
              }}
            />
          </div>
          <Link
            href="/dashboard/subscription"
            className="mt-3 flex w-full items-center justify-center rounded-lg bg-[var(--comvexa-accent,#2563eb)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
          >
            {accessLoading ? "Loading..." : trialLabel ? "View trial" : accessActive ? "Manage plan" : "Choose plan"}
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

function MobileNavLink({
  item,
  pathname,
  label,
}: {
  item: (typeof navItems)[number];
  pathname: string;
  label: string;
}) {
  const Icon = item.icon;
  const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-bold transition ${
        isActive
          ? "bg-[var(--comvexa-accent-soft,#dffff8)] text-[var(--comvexa-accent,#0c8b84)]"
          : "text-[var(--comvexa-muted,#5d7477)]"
      }`}
    >
      <Icon size={19} />
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

function planModulesCount(plan: PlanName) {
  return String(planModules[plan].length);
}
