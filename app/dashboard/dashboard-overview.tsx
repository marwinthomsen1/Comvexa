"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
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
  Target,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
import { formatCurrencyAmount } from "../_components/currency-display";
import { openFirstPlanTutorial } from "./_components/first-plan-tutorial";

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

type Booking = {
  id: string;
  booking_date: string | null;
  start_time: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
};

type Invoice = {
  id: string;
  invoice_number: string | null;
  total_amount: number | null;
  payment_status: string | null;
  due_date: string | null;
};

type DocumentRecord = {
  id: string;
  title: string | null;
  document_type: string | null;
  expiry_date: string | null;
  created_at: string | null;
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
  currency: string;
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
  currency: "USD",
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

function money(value: number, currency: string) {
  return formatCurrencyAmount(value, currency);
}

function dateKey(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function isOverdue(date: string | null) {
  return Boolean(date && date < dateKey());
}

function isToday(date: string | null) {
  return date === dateKey();
}

function friendlyDate(date: string | null) {
  if (!date) {
    return "No date";
  }

  if (isToday(date)) {
    return "Today";
  }

  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DashboardOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
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
      bookingsResult,
      tasksResult,
      invoicesResult,
      documentsResult,
      paymentsResult,
    ] = await Promise.all([
      supabase
        .from("customers")
        .select("id, name, email, phone, created_at", { count: "exact" })
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase.from("employees").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase.from("services").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase
        .from("bookings")
        .select("id, booking_date, start_time, status, notes, created_at", { count: "exact" })
        .eq("company_id", companyId)
        .order("booking_date", { ascending: true })
        .limit(6),
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
        .from("documents")
        .select("id, title, document_type, expiry_date, created_at", { count: "exact" })
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("payments")
        .select("id, amount, payment_method, payment_date, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    setCustomers((customersResult.data ?? []) as Customer[]);
    setTasks((tasksResult.data ?? []) as Task[]);
    setBookings((bookingsResult.data ?? []) as Booking[]);
    setInvoices((invoicesResult.data ?? []) as Invoice[]);
    setDocuments((documentsResult.data ?? []) as DocumentRecord[]);
    setPayments((paymentsResult.data ?? []) as Payment[]);
    setCounts({
      customers: customersResult.count ?? 0,
      employees: employeesCount.count ?? 0,
      services: servicesCount.count ?? 0,
      bookings: bookingsResult.count ?? 0,
      tasks: tasksResult.count ?? 0,
      invoices: invoicesResult.count ?? 0,
      documents: documentsResult.count ?? 0,
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
  const overdueInvoices = invoices.filter((invoice) => invoice.payment_status !== "paid" && isOverdue(invoice.due_date));
  const dueTodayTasks = tasks.filter((task) => task.status !== "completed" && isToday(task.due_date));
  const overdueTasks = tasks.filter((task) => task.status !== "completed" && isOverdue(task.due_date));
  const todayBookings = bookings.filter((booking) => isToday(booking.booking_date));
  const expiringDocuments = documents.filter((document) => {
    if (!document.expiry_date) {
      return false;
    }

    const expiry = new Date(document.expiry_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  });

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
  const healthScore = Math.max(
    12,
    Math.min(
      100,
      Math.round(
        setupPercent * 0.45 +
          (counts.customers > 0 ? 15 : 0) +
          (revenue > 0 ? 15 : 0) +
          (overdueInvoices.length === 0 ? 13 : 3) +
          (overdueTasks.length === 0 ? 12 : 4),
      ),
    ),
  );

  const healthTone =
    healthScore >= 80 ? "Excellent" : healthScore >= 55 ? "Getting stronger" : "Needs setup";

  const nextStep = setupItems.find((item) => !item.complete) ?? {
    label: overdueInvoices.length ? "Collect overdue invoices" : "Review performance",
    href: overdueInvoices.length ? "/dashboard/invoices" : "/dashboard/reports",
  };

  const todayItems = [
    ...todayBookings.map((booking) => ({
      id: `booking-${booking.id}`,
      title: booking.notes || "Booking scheduled",
      meta: booking.start_time ? `Starts at ${booking.start_time}` : "Scheduled today",
      href: "/dashboard/bookings",
      icon: CalendarDays,
      tone: "cyan",
    })),
    ...dueTodayTasks.map((task) => ({
      id: `task-${task.id}`,
      title: task.title ?? "Task due today",
      meta: `${task.priority ?? "Normal"} priority`,
      href: "/dashboard/tasks",
      icon: ListChecks,
      tone: "amber",
    })),
    ...overdueInvoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      title: invoice.invoice_number ?? "Overdue invoice",
      meta: `${money(Number(invoice.total_amount ?? 0), viewSettings.currency)} due ${friendlyDate(invoice.due_date)}`,
      href: "/dashboard/invoices",
      icon: AlertTriangle,
      tone: "red",
    })),
    ...expiringDocuments.map((document) => ({
      id: `document-${document.id}`,
      title: document.title ?? "Document expiring",
      meta: `${document.document_type ?? "Document"} expires ${friendlyDate(document.expiry_date)}`,
      href: "/dashboard/documents",
      icon: FileText,
      tone: "blue",
    })),
  ].slice(0, 5);

  const activityItems = [
    ...payments.map((payment) => ({
      id: `payment-${payment.id}`,
      title: "Payment recorded",
      meta: `${money(Number(payment.amount ?? 0), viewSettings.currency)}${payment.payment_method ? ` via ${payment.payment_method}` : ""}`,
      date: payment.created_at ?? payment.payment_date,
      icon: CreditCard,
      href: "/dashboard/payments",
    })),
    ...invoices.map((invoice) => ({
      id: `invoice-activity-${invoice.id}`,
      title: invoice.invoice_number ?? "Invoice created",
      meta: `${money(Number(invoice.total_amount ?? 0), viewSettings.currency)} - ${invoice.payment_status ?? "unpaid"}`,
      date: invoice.due_date,
      icon: ReceiptText,
      href: "/dashboard/invoices",
    })),
    ...customers.map((customer) => ({
      id: `customer-${customer.id}`,
      title: customer.name ?? "Customer added",
      meta: customer.email ?? customer.phone ?? "New customer profile",
      date: customer.created_at,
      icon: Users,
      href: "/dashboard/customers",
    })),
  ]
    .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")))
    .slice(0, 6);

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
      value: money(revenue, viewSettings.currency),
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
      <section className="overflow-hidden rounded-[var(--comvexa-radius,2rem)] border comvexa-theme-surface shadow-sm">
        <div className="grid gap-0 xl:grid-cols-[1fr_420px]">
          <div className="comvexa-theme-soft p-6 text-slate-950 sm:p-8">
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
                  This dashboard updates from your company records. Add
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
                    className="rounded-2xl border comvexa-theme-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
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
                    <p className="mt-2 text-3xl font-semibold" data-no-translate>{isLoading ? "-" : stat.value}</p>
                    <p className="mt-1 text-sm text-slate-500">{stat.note}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          <aside className="comvexa-theme-surface p-6 sm:p-8">
            {viewSettings.showSetup ? (
            <div className="rounded-[var(--comvexa-radius,1.5rem)] border border-blue-100 comvexa-theme-soft p-5">
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
                    className="flex items-center justify-between rounded-2xl border comvexa-theme-card px-4 py-3 text-sm hover:border-blue-200 hover:bg-blue-50"
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

            <div className={`${viewSettings.showSetup ? "mt-4" : ""} rounded-[var(--comvexa-radius,1.5rem)] border border-blue-100 comvexa-theme-soft p-5`}>
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
                <button
                  type="button"
                  onClick={openFirstPlanTutorial}
                  className="flex items-center gap-3 rounded-2xl border comvexa-theme-card px-4 py-3 text-left text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50"
                >
                  <Sparkles size={16} />
                  Open tutorial
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.75fr_0.9fr]">
        <Panel
          title="Today view"
          description="Bookings, tasks, collections, and documents that need attention now."
          actionHref={nextStep.href}
          actionLabel="Next step"
        >
          <div className="p-5">
            {todayItems.length ? (
              <div className="grid gap-3">
                {todayItems.map((item) => (
                  <InsightLink key={item.id} {...item} />
                ))}
              </div>
            ) : (
              <SmartEmptyState
                icon={Target}
                title="Nothing urgent today"
                text="You are clear for the moment. Add tasks, bookings, invoices, or document expiries and Comvexa will surface them here."
                href={nextStep.href}
                action={`Next: ${nextStep.label}`}
              />
            )}
          </div>
        </Panel>

        <Panel
          title="Business health"
          description="A quick read on setup, collection risk, and operating momentum."
          actionHref="/dashboard/reports"
          actionLabel="Reports"
        >
          <div className="p-5">
            <div className="rounded-3xl border border-blue-100 comvexa-theme-soft p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{healthTone}</p>
                  <p className="mt-1 text-sm text-slate-500">Workspace health score</p>
                </div>
                <div
                  className="flex size-20 items-center justify-center rounded-full text-2xl font-semibold text-white shadow-lg"
                  style={{ backgroundColor: viewSettings.accent }}
                >
                  {isLoading ? "-" : healthScore}
                </div>
              </div>
              <div className="mt-5 grid gap-2">
                <HealthRow label="Setup foundations" value={`${setupPercent}%`} good={setupPercent >= 80} />
                <HealthRow label="Overdue invoices" value={String(overdueInvoices.length)} good={overdueInvoices.length === 0} />
                <HealthRow label="Overdue tasks" value={String(overdueTasks.length)} good={overdueTasks.length === 0} />
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Activity feed"
          description="Recent customer, invoice, and payment movement."
          actionHref="/dashboard/reports"
          actionLabel="All reports"
        >
          {activityItems.length ? (
            <div className="divide-y divide-slate-100">
              {activityItems.map((item) => (
                <ActivityItem key={item.id} {...item} />
              ))}
            </div>
          ) : (
            <div className="p-5">
              <SmartEmptyState
                icon={Activity}
                title="No activity yet"
                text="Add a customer, create an invoice, or record a payment and the latest activity will appear here."
                href="/dashboard/customers"
                action="Add first customer"
              />
            </div>
          )}
        </Panel>
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
                  <p className="mt-2 text-4xl font-semibold" data-no-translate>
                    {isLoading ? "-" : money(revenue, viewSettings.currency)}
                  </p>
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
              meta: `${money(Number(invoice.total_amount ?? 0), viewSettings.currency)} - ${invoice.payment_status ?? "unpaid"}`,
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
              {nextStep.label}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Comvexa now recommends the next useful action from your current
              records. Finish setup, collect overdue invoices, or review
              performance when the workspace is already running smoothly.
            </p>
          </div>
          <Link
            href={nextStep.href}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: viewSettings.accent }}
          >
            Continue
            <LayoutGrid size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}

function InsightLink({
  title,
  meta,
  href,
  icon: Icon,
  tone,
}: {
  title: string;
  meta: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: string;
}) {
  const toneClass =
    {
      amber: "bg-amber-50 text-amber-700 ring-amber-100",
      blue: "bg-blue-50 text-blue-700 ring-blue-100",
      cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
      red: "bg-red-50 text-red-700 ring-red-100",
    }[tone] ?? "bg-blue-50 text-blue-700 ring-blue-100";

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-3xl border border-blue-100 comvexa-theme-soft p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:shadow-blue-100/70"
    >
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClass}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-950">{title}</p>
        <p className="mt-1 truncate text-sm text-slate-500">{meta}</p>
      </div>
      <ArrowRight size={16} className="text-slate-300 transition group-hover:text-blue-600" />
    </Link>
  );
}

function HealthRow({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-blue-100">
      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {good ? (
          <CheckCircle2 size={16} className="text-cyan-600" />
        ) : (
          <AlertTriangle size={16} className="text-amber-600" />
        )}
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function ActivityItem({
  title,
  meta,
  date,
  href,
  icon: Icon,
}: {
  title: string;
  meta: string;
  date: string | null;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <Link href={href} className="flex items-center gap-4 p-5 hover:bg-blue-50/50">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-950">{title}</p>
        <p className="mt-1 truncate text-sm text-slate-500">{meta}</p>
      </div>
      <span className="hidden text-xs font-medium text-slate-400 sm:block">{friendlyDate(date)}</span>
    </Link>
  );
}

function SmartEmptyState({
  icon: Icon,
  title,
  text,
  href,
  action,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-blue-200 comvexa-theme-soft p-5">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-blue-700 ring-1 ring-blue-100">
        <Icon size={20} />
      </span>
      <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {action}
        <ArrowRight size={15} />
      </Link>
    </div>
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
    <div className="overflow-hidden rounded-[1.5rem] border comvexa-theme-surface shadow-sm">
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
    <Link href={href} className="rounded-3xl border border-blue-100 comvexa-theme-soft p-5 hover:bg-white">
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

