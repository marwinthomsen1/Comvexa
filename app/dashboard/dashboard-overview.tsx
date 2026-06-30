"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  LayoutGrid,
  ListChecks,
  Plus,
  ReceiptText,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";

type Customer = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
};

type Task = {
  id: string;
  title: string | null;
  priority: string | null;
  status: string | null;
  due_date: string | null;
};

type Invoice = {
  id: string;
  invoice_number: string | null;
  total_amount: number | null;
  payment_status: string | null;
  due_date: string | null;
};

type Payment = {
  id: string;
  amount: number | null;
  payment_method: string | null;
  payment_date: string | null;
  created_at: string | null;
};

type DashboardCounts = {
  customers: number;
  employees: number;
  services: number;
  bookings: number;
  tasks: number;
  invoices: number;
  documents: number;
};

type WorkspaceViewSettings = {
  companyDisplayName: string;
  dashboardStyle: string;
  accent: string;
  showSetup: boolean;
  showFinancePulse: boolean;
};

const initialCounts: DashboardCounts = {
  customers: 0,
  employees: 0,
  services: 0,
  bookings: 0,
  tasks: 0,
  invoices: 0,
  documents: 0,
};

const defaultViewSettings: WorkspaceViewSettings = {
  companyDisplayName: "New Company",
  dashboardStyle: "Executive",
  accent: "#2563eb",
  showSetup: true,
  showFinancePulse: true,
};

function readViewSettings(): WorkspaceViewSettings {
  try {
    const saved = window.localStorage.getItem("comvexa-workspace-settings");
    return saved ? { ...defaultViewSettings, ...JSON.parse(saved) } : defaultViewSettings;
  } catch {
    return defaultViewSettings;
  }
}

function money(value: number) {
  return `$${value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

export function DashboardOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [counts, setCounts] = useState<DashboardCounts>(initialCounts);
  const [viewSettings, setViewSettings] = useState<WorkspaceViewSettings>(defaultViewSettings);

  async function loadDashboard(showRefresh = false) {
    if (showRefresh) {
      setIsRefreshing(true);
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const companyId = profile.company_id;

    const [
      customersResult,
      employeesCount,
      servicesCount,
      bookingsCount,
      tasksResult,
      invoicesResult,
      paymentsResult,
      documentsCount,
    ] = await Promise.all([
      supabase
        .from("customers")
        .select("id, name, email, phone, created_at", { count: "exact" })
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase.from("employees").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase.from("services").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase
        .from("tasks")
        .select("id, title, priority, status, due_date", { count: "exact" })
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("invoices")
        .select("id, invoice_number, total_amount, payment_status, due_date", { count: "exact" })
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("payments")
        .select("id, amount, payment_method, payment_date, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("documents").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    ]);

    setCustomers((customersResult.data ?? []) as Customer[]);
    setTasks((tasksResult.data ?? []) as Task[]);
    setInvoices((invoicesResult.data ?? []) as Invoice[]);
    setPayments((paymentsResult.data ?? []) as Payment[]);
    setCounts({
      customers: customersResult.count ?? 0,
      employees: employeesCount.count ?? 0,
      services: servicesCount.count ?? 0,
      bookings: bookingsCount.count ?? 0,
      tasks: tasksResult.count ?? 0,
      invoices: invoicesResult.count ?? 0,
      documents: documentsCount.count ?? 0,
    });
    setIsLoading(false);
    setIsRefreshing(false);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => loadDashboard(), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    function loadSettings() {
      setViewSettings(readViewSettings());
    }

    loadSettings();
    window.addEventListener("storage", loadSettings);
    window.addEventListener("comvexa-settings-change", loadSettings);

    return () => {
      window.removeEventListener("storage", loadSettings);
      window.removeEventListener("comvexa-settings-change", loadSettings);
    };
  }, []);

  const revenue = payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const pendingTasks = tasks.filter((task) => task.status !== "completed").length;
  const unpaidInvoices = invoices.filter((invoice) => invoice.payment_status !== "paid").length;

  const setupItems = useMemo(
    () => [
      { label: "Add customers", complete: counts.customers > 0, href: "/dashboard/customers" },
      { label: "Create services", complete: counts.services > 0, href: "/dashboard/services" },
      { label: "Invite employees", complete: counts.employees > 0, href: "/dashboard/employees" },
      { label: "Create invoices", complete: counts.invoices > 0, href: "/dashboard/invoices" },
      { label: "Upload documents", complete: counts.documents > 0, href: "/dashboard/documents" },
    ],
    [counts],
  );

  const completedSetup = setupItems.filter((item) => item.complete).length;
  const setupPercent = Math.round((completedSetup / setupItems.length) * 100);

  const mainStats = [
    {
      label: "Customers",
      value: String(counts.customers),
      note: "Company relationships",
      href: "/dashboard/customers",
      icon: Users,
    },
    {
      label: "Revenue",
      value: money(revenue),
      note: "Recorded payments",
      href: "/dashboard/payments",
      icon: WalletCards,
    },
    {
      label: "Open work",
      value: String(counts.bookings + pendingTasks),
      note: "Bookings and tasks",
      href: "/dashboard/tasks",
      icon: CalendarDays,
    },
    {
      label: "Unpaid invoices",
      value: String(unpaidInvoices),
      note: "Needs collection",
      href: "/dashboard/invoices",
      icon: ReceiptText,
    },
  ];

  const quickActions = [
    { label: "New customer", href: "/dashboard/customers", icon: Users },
    { label: "New invoice", href: "/dashboard/invoices", icon: ReceiptText },
    { label: "Record payment", href: "/dashboard/payments", icon: CreditCard },
    { label: "Upload PDF", href: "/dashboard/documents", icon: FileText },
  ];

  return (
    <main className="comvexa-dashboard-main mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="overflow-hidden rounded-[var(--comvexa-radius,2rem)] border border-blue-100 bg-white shadow-sm shadow-blue-100/70">
        <div className="grid gap-0 xl:grid-cols-[1fr_420px]">
          <div className="bg-[#f7fbff] p-6 text-slate-950 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p
                  className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ borderColor: `${viewSettings.accent}33`, color: viewSettings.accent }}
                >
                  <Sparkles size={14} />
                  {viewSettings.dashboardStyle} operations center
                </p>
                <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-normal sm:text-4xl">
                  {viewSettings.companyDisplayName} workspace, built from real business records.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                  This dashboard updates from your Supabase company data. Add
                  customers, services, tasks, invoices, payments, and documents
                  to turn Comvexa into your daily operating system.
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadDashboard(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50"
              >
                <RefreshCw className={isRefreshing ? "animate-spin" : ""} size={16} />
                Refresh
              </button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {mainStats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <Link
                    key={stat.label}
                    href={stat.href}
                    className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="flex size-10 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-100"
                        style={{ color: viewSettings.accent }}
                      >
                        <Icon size={18} />
                      </span>
                      <ArrowRight size={16} className="text-blue-300" />
                    </div>
                    <p className="mt-5 text-xs font-medium uppercase tracking-widest text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-semibold">{isLoading ? "-" : stat.value}</p>
                    <p className="mt-1 text-sm text-slate-500">{stat.note}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          <aside className="bg-white p-6 sm:p-8">
            {viewSettings.showSetup ? (
            <div className="rounded-[var(--comvexa-radius,1.5rem)] border border-blue-100 bg-[#f7fbff] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Workspace setup</p>
                  <p className="mt-1 text-sm text-slate-500">{completedSetup} of {setupItems.length} foundations complete</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                  {setupPercent}%
                </span>
              </div>
              <div className="mt-5 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${setupPercent}%`, backgroundColor: viewSettings.accent }}
                />
              </div>
              <div className="mt-5 grid gap-2">
                {setupItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm hover:border-blue-200 hover:bg-blue-50"
                  >
                    <span className="flex items-center gap-3 font-medium text-slate-700">
                      <CheckCircle2
                        size={17}
                        style={{ color: item.complete ? viewSettings.accent : undefined }}
                      />
                      {item.label}
                    </span>
                    <ArrowRight size={15} className="text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
            ) : null}

            <div className={`${viewSettings.showSetup ? "mt-4" : ""} rounded-[var(--comvexa-radius,1.5rem)] border border-blue-100 bg-[#f7fbff] p-5`}>
              <p className="text-sm font-semibold text-slate-950">Quick actions</p>
              <div className="mt-4 grid gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm"
                      style={{ backgroundColor: viewSettings.accent }}
                    >
                      <Plus size={16} />
                      <Icon size={17} className="text-cyan-200" />
                      {action.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Panel
          title="Operating pipeline"
          description="Where work is moving across customers, tasks, bookings, and invoices."
          actionHref="/dashboard/reports"
          actionLabel="View reports"
        >
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <PipelineCard icon={Users} label="Customer base" value={counts.customers} href="/dashboard/customers" />
            <PipelineCard icon={ListChecks} label="Total tasks" value={counts.tasks} href="/dashboard/tasks" />
            <PipelineCard icon={CalendarDays} label="Bookings" value={counts.bookings} href="/dashboard/bookings" />
            <PipelineCard icon={ReceiptText} label="Invoices" value={counts.invoices} href="/dashboard/invoices" />
          </div>
        </Panel>

        {viewSettings.showFinancePulse ? (
          <Panel
            title="Finance pulse"
            description="A clean snapshot of money captured in this workspace."
            actionHref="/dashboard/payments"
            actionLabel="Open payments"
          >
          <div className="p-5">
            <div
              className="rounded-[var(--comvexa-radius,1.5rem)] p-5 text-white"
              style={{ backgroundColor: viewSettings.accent }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Recorded revenue</p>
                  <p className="mt-2 text-4xl font-semibold">{isLoading ? "-" : money(revenue)}</p>
                </div>
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-100">
                  <TrendingUp size={22} />
                </span>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <MiniStat label="Payments" value={payments.length} />
                <MiniStat label="Unpaid invoices" value={unpaidInvoices} />
              </div>
            </div>
          </div>
          </Panel>
        ) : null}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Recent customers" description="Latest company contacts." actionHref="/dashboard/customers" actionLabel="Customers">
          <RecordList
            empty="No customers yet. Add customers to start building your company CRM."
            items={customers.map((customer) => ({
              id: customer.id,
              title: customer.name ?? "Unnamed customer",
              meta: customer.email ?? customer.phone ?? "No contact details",
              icon: Users,
            }))}
          />
        </Panel>

        <Panel title="Priority tasks" description="Work that needs attention." actionHref="/dashboard/tasks" actionLabel="Tasks">
          <RecordList
            empty="No tasks yet. Create operational work for your team."
            items={tasks.map((task) => ({
              id: task.id,
              title: task.title ?? "Untitled task",
              meta: `${task.priority ?? "Normal"} priority${task.due_date ? ` - due ${task.due_date}` : ""}`,
              icon: Clock3,
            }))}
          />
        </Panel>

        <Panel title="Recent invoices" description="Customer billing activity." actionHref="/dashboard/invoices" actionLabel="Invoices">
          <RecordList
            empty="No invoices yet. Create your first invoice when billing starts."
            items={invoices.map((invoice) => ({
              id: invoice.id,
              title: invoice.invoice_number ?? "Invoice",
              meta: `${money(Number(invoice.total_amount ?? 0))} - ${invoice.payment_status ?? "unpaid"}`,
              icon: FileText,
            }))}
          />
        </Panel>
      </section>

      <section className="mt-6 rounded-[var(--comvexa-radius,2rem)] border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Next best step</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
              Make the dashboard yours from Workspace Settings.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Adjust your company display name, accent color, sidebar style,
              density, timezone, currency, and visible modules so Comvexa feels
              custom to your business instead of generic.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: viewSettings.accent }}
          >
            Customize workspace
            <LayoutGrid size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}

function Panel({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white shadow-sm shadow-blue-100/70">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
        <div>
          <h2 className="font-semibold tracking-normal text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="hidden shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:inline-flex"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function PipelineCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-3xl border border-blue-100 bg-[#f7fbff] p-5 hover:bg-white">
      <div className="flex items-center justify-between">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-blue-700 ring-1 ring-blue-100">
          <Icon size={19} />
        </span>
        <ArrowRight size={16} className="text-slate-400" />
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">{value}</p>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function RecordList({
  items,
  empty,
}: {
  items: Array<{
    id: string;
    title: string;
    meta: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }>;
  empty: string;
}) {
  if (!items.length) {
    return (
      <div className="p-5">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
          {empty}
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.id} className="flex items-center gap-4 p-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 truncate text-sm text-slate-500">{item.meta}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
