"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Database,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  HandCoins,
  LifeBuoy,
  LogOut,
  Mail,
  Package,
  PanelLeft,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { isAdminEmail } from "@/src/lib/admin/access";
import { supabase } from "@/src/lib/supabase/client";

type AdminRow = Record<string, unknown>;

type AdminOverview = {
  adminEmail: string;
  counts: Record<string, number>;
  financials: Record<string, number>;
  breakdowns: Record<string, Record<string, number>>;
  alerts: Record<string, number>;
  activityLast30Days: Record<string, number>;
  topCompanies: AdminRow[];
  recentCompanies: AdminRow[];
  recentCustomers: AdminRow[];
  recentInvoices: AdminRow[];
  recentPayments: AdminRow[];
  recentExpenses: AdminRow[];
  recentSupplierBills: AdminRow[];
  recentTasks: AdminRow[];
  recentBookings: AdminRow[];
  recentEmployees: AdminRow[];
  recentDocuments: AdminRow[];
  recentInventory: AdminRow[];
  recentBranches: AdminRow[];
  recentUsers: AdminRow[];
  recentEmailLogs: AdminRow[];
};

type AdminTab = "overview" | "companies" | "users" | "email" | "activity" | "tools";

const tabs: Array<{ id: AdminTab; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Command Center", icon: BarChart3 },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "users", label: "Users", icon: Users },
  { id: "email", label: "Email Center", icon: Mail },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "tools", label: "Admin Tools", icon: SlidersHorizontal },
];

const planOptions = ["basic", "pro", "ultra"];
const statusOptions = ["inactive", "trialing", "trial_expired", "active", "past_due", "cancelled"];
const billingOptions = ["", "monthly", "yearly"];
const emailTemplates = [
  {
    id: "custom",
    label: "Custom message",
    subject: "A quick update from Comvexa",
    message: "Thanks for using Comvexa. We wanted to send you a quick update about your workspace.",
    ctaLabel: "Open Comvexa",
    ctaUrl: "https://comvexa.net/login",
  },
  {
    id: "password_reset",
    label: "Password reset",
    subject: "Reset your Comvexa password",
    message: "A secure password reset email will be sent through Supabase Auth. The customer can use it to set a new password.",
    ctaLabel: "",
    ctaUrl: "",
  },
  {
    id: "welcome",
    label: "Welcome email",
    subject: "Welcome to Comvexa",
    message: "Welcome to Comvexa. Your workspace is ready, and you can now manage customers, employees, bookings, invoices, payments, and daily operations in one place.",
    ctaLabel: "Open Comvexa",
    ctaUrl: "https://comvexa.net/login",
  },
  {
    id: "trial_ending",
    label: "Trial ending soon",
    subject: "Your Comvexa trial ends soon",
    message: "Your Comvexa trial is ending soon. Add your payment details to keep your workspace active without interruption.",
    ctaLabel: "Manage subscription",
    ctaUrl: "https://comvexa.net/dashboard/subscription",
  },
  {
    id: "payment_failed",
    label: "Payment failed",
    subject: "Comvexa payment failed",
    message: "We could not complete your Comvexa payment. Please update your billing details to keep your workspace active.",
    ctaLabel: "Update payment",
    ctaUrl: "https://comvexa.net/dashboard/subscription/payment",
  },
  {
    id: "invoice_reminder",
    label: "Invoice reminder",
    subject: "Invoice reminder from Comvexa",
    message: "This is a friendly reminder that an invoice is waiting for payment. Please review it when you have a moment.",
    ctaLabel: "Open Comvexa",
    ctaUrl: "https://comvexa.net/login",
  },
  {
    id: "booking_reminder",
    label: "Booking reminder",
    subject: "Upcoming booking reminder",
    message: "This is a reminder about an upcoming booking scheduled in Comvexa. Please review the details before the appointment.",
    ctaLabel: "View bookings",
    ctaUrl: "https://comvexa.net/dashboard/bookings",
  },
  {
    id: "security_notice",
    label: "Security notice",
    subject: "Security notice for your Comvexa account",
    message: "We noticed an important account security update. If this was you, no action is needed. If not, please reset your password and contact support.",
    ctaLabel: "Open Comvexa",
    ctaUrl: "https://comvexa.net/login",
  },
];

function companyName(row: AdminRow) {
  const company = row.companies;

  if (Array.isArray(company)) {
    return String((company[0] as AdminRow | undefined)?.name ?? "Company");
  }

  if (company && typeof company === "object") {
    return String((company as AdminRow).name ?? "Company");
  }

  return "Company";
}

function formatDate(value: unknown) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(String(value)));
}

function money(value: unknown) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

function titleize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function rowText(row: AdminRow) {
  return Object.values(row)
    .map((value) => (typeof value === "object" ? JSON.stringify(value) : String(value ?? "")))
    .join(" ")
    .toLowerCase();
}

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, columns: string[], rows: string[][]) {
  const csv = [columns, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminDashboard() {
  const router = useRouter();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [savingCompanyId, setSavingCompanyId] = useState("");

  const loadOverview = useCallback(async () => {
    setError("");
    setIsLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.replace("/login");
      return;
    }

    if (!isAdminEmail(session.user.email)) {
      router.replace("/dashboard");
      return;
    }

    const response = await fetch("/api/admin/overview", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    const data = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Could not load admin dashboard.");
      return;
    }

    setOverview(data);
    setSelectedCompanyId((current) => current || String(data.recentCompanies?.[0]?.id ?? ""));
  }, [router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadOverview();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadOverview]);

  const selectedCompany = useMemo(
    () => overview?.recentCompanies.find((company) => String(company.id) === selectedCompanyId) ?? null,
    [overview, selectedCompanyId],
  );

  const filteredCompanies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (overview?.recentCompanies ?? []).filter((company) => {
      const matchesQuery = !normalizedQuery || rowText(company).includes(normalizedQuery);
      const matchesPlan = planFilter === "all" || String(company.plan ?? "").toLowerCase() === planFilter;
      const matchesStatus =
        statusFilter === "all" || String(company.subscription_status ?? "").toLowerCase() === statusFilter;

      return matchesQuery && matchesPlan && matchesStatus;
    });
  }, [overview, planFilter, query, statusFilter]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (overview?.recentUsers ?? []).filter((user) => !normalizedQuery || rowText(user).includes(normalizedQuery));
  }, [overview, query]);

  const metrics = useMemo(() => {
    const counts = overview?.counts ?? {};

    return [
      ["Companies", counts.companies ?? 0, Building2, "Total workspaces"],
      ["Users", counts.profiles ?? 0, Users, "Profiles created"],
      ["Customers", counts.customers ?? 0, Users, "Customer records"],
      ["Invoices", counts.invoices ?? 0, ReceiptText, "Invoices tracked"],
      ["Bookings", counts.bookings ?? 0, CalendarClock, "Calendar items"],
      ["Inventory", counts.inventory_items ?? 0, Package, "Stock items"],
    ] satisfies Array<[string, number, LucideIcon, string]>;
  }, [overview]);

  const financialCards = useMemo(() => {
    const financials = overview?.financials ?? {};

    return [
      ["Invoice total", money(financials.invoiceTotal), ReceiptText],
      ["Paid invoices", money(financials.paidInvoiceTotal), DollarSign],
      ["Unpaid invoices", money(financials.unpaidInvoiceTotal), WalletCards],
      ["Payments received", money(financials.paymentsTotal), CreditCard],
      ["Expenses", money(financials.expensesTotal), HandCoins],
      ["Supplier bills", money(financials.supplierBillsTotal), FileText],
    ] satisfies Array<[string, string, LucideIcon]>;
  }, [overview]);

  const alertCards = useMemo(() => {
    const alerts = overview?.alerts ?? {};

    return [
      ["Overdue invoices", alerts.overdueInvoices ?? 0, "Collect money that is late"],
      ["Supplier bills due", alerts.upcomingSupplierBills ?? 0, "Bills due in the next 7 days"],
      ["Low stock items", alerts.lowStockItems ?? 0, "Inventory needs attention"],
      ["Open tasks", alerts.openTasks ?? 0, "Work still in progress"],
    ] satisfies Array<[string, number, string]>;
  }, [overview]);

  const activityFeed = useMemo(() => {
    const items = [
      ...(overview?.recentCompanies ?? []).map((row) => ({
        type: "Company",
        title: String(row.name ?? "Company created"),
        detail: `${String(row.plan ?? "basic")} - ${String(row.subscription_status ?? "inactive")}`,
        date: row.created_at,
      })),
      ...(overview?.recentInvoices ?? []).map((row) => ({
        type: "Invoice",
        title: String(row.invoice_number ?? "Invoice"),
        detail: `${companyName(row)} - ${money(row.total_amount)}`,
        date: row.created_at,
      })),
      ...(overview?.recentBookings ?? []).map((row) => ({
        type: "Booking",
        title: companyName(row),
        detail: `${formatDate(row.booking_date)} - ${String(row.status ?? "pending")}`,
        date: row.created_at,
      })),
      ...(overview?.recentEmailLogs ?? []).map((row) => ({
        type: "Email",
        title: String(row.subject ?? row.email_type ?? "Email"),
        detail: `${String(row.recipient ?? "-")} - ${String(row.status ?? "-")}`,
        date: row.created_at,
      })),
    ];

    return items
      .filter((item) => item.date)
      .sort((left, right) => new Date(String(right.date)).getTime() - new Date(String(left.date)).getTime())
      .slice(0, 18);
  }, [overview]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function updateCompany(companyId: string, updates: Record<string, string>) {
    setError("");
    setNotice("");
    setSavingCompanyId(companyId);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.replace("/login");
      return;
    }

    const response = await fetch("/api/admin/overview", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ companyId, ...updates }),
    });
    const data = await response.json();
    setSavingCompanyId("");

    if (!response.ok) {
      setError(data.error ?? "Could not update company.");
      return;
    }

    setNotice("Company updated.");
    await loadOverview();
  }

  function exportCompanies() {
    downloadCsv(
      "comvexa-companies.csv",
      ["Company", "Email", "Phone", "Plan", "Status", "Billing", "Created"],
      filteredCompanies.map((row) => [
        String(row.name ?? ""),
        String(row.email ?? ""),
        String(row.phone ?? ""),
        String(row.plan ?? ""),
        String(row.subscription_status ?? ""),
        String(row.billing_cycle ?? ""),
        formatDate(row.created_at),
      ]),
    );
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf3f8] p-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-600 shadow-sm">
          Loading admin console...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf3f8] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase text-emerald-700 ring-1 ring-emerald-100">
              <ShieldCheck size={14} />
              Admin Console
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal">Comvexa control center</h1>
            <p className="mt-1 text-sm text-slate-500">Signed in as {overview?.adminEmail ?? "admin"}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] lg:min-w-[620px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search companies, users, emails"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none ring-0 transition focus:border-emerald-300 focus:bg-white"
              />
            </label>
            <button
              type="button"
              onClick={loadOverview}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[250px_1fr]">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-[#10233f] p-3 text-white shadow-sm">
          <div className="flex items-center gap-3 px-3 py-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <PanelLeft size={20} />
            </span>
            <div>
              <p className="font-semibold">Admin Menu</p>
              <p className="text-xs text-slate-300">Manage Comvexa</p>
            </div>
          </div>
          <nav className="mt-3 grid gap-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  activeTab === id ? "bg-white text-slate-950" : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <p className="text-xs font-semibold uppercase text-slate-300">Quick health</p>
            <p className="mt-2 text-2xl font-semibold">{overview?.counts.companies ?? 0}</p>
            <p className="text-sm text-slate-300">workspaces tracked</p>
          </div>
        </aside>

        <section className="min-w-0">
          {error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
              {notice}
            </div>
          ) : null}

          {activeTab === "overview" ? (
            <OverviewTab
              metrics={metrics}
              financialCards={financialCards}
              alertCards={alertCards}
              overview={overview}
              activityFeed={activityFeed}
              onOpenCompanies={() => setActiveTab("companies")}
            />
          ) : null}

          {activeTab === "companies" ? (
            <CompaniesTab
              companies={filteredCompanies}
              selectedCompany={selectedCompany}
              planFilter={planFilter}
              statusFilter={statusFilter}
              savingCompanyId={savingCompanyId}
              onPlanFilterChange={setPlanFilter}
              onStatusFilterChange={setStatusFilter}
              onSelectCompany={setSelectedCompanyId}
              onUpdateCompany={updateCompany}
              onExportCompanies={exportCompanies}
            />
          ) : null}

          {activeTab === "users" ? <UsersTab users={filteredUsers} overview={overview} /> : null}

          {activeTab === "email" ? <EmailTab overview={overview} onSent={loadOverview} /> : null}

          {activeTab === "activity" ? (
            <ActivityTab overview={overview} activityFeed={activityFeed} financialCards={financialCards} />
          ) : null}

          {activeTab === "tools" ? <ToolsTab overview={overview} onRefresh={loadOverview} /> : null}
        </section>
      </div>
    </main>
  );
}

function OverviewTab({
  metrics,
  financialCards,
  alertCards,
  overview,
  activityFeed,
  onOpenCompanies,
}: {
  metrics: Array<[string, number, LucideIcon, string]>;
  financialCards: Array<[string, string, LucideIcon]>;
  alertCards: Array<[string, number, string]>;
  overview: AdminOverview | null;
  activityFeed: Array<{ type: string; title: string; detail: string; date: unknown }>;
  onOpenCompanies: () => void;
}) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-blue-700">Live operations</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">See the whole SaaS from one place.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Track customers, billing, trials, bookings, documents, inventory, emails, and support signals without
              digging through every workspace one by one.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onOpenCompanies}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <Building2 size={17} />
                Manage companies
              </button>
              <a
                href="/api/test-email"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Mail size={17} />
                Test email route
              </a>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-950 p-5 text-white">
            <p className="text-sm font-semibold text-slate-300">Attention score</p>
            <p className="mt-4 text-5xl font-semibold">
              {Object.values(overview?.alerts ?? {}).reduce((total, value) => total + value, 0)}
            </p>
            <p className="mt-2 text-sm text-slate-300">items need admin review</p>
            <div className="mt-5 grid gap-2">
              {alertCards.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2">
                  <span className="text-sm text-slate-200">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([label, value, Icon, detail]) => (
          <MetricTile key={label} label={label} value={String(value)} detail={detail} icon={Icon} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {financialCards.map(([label, value, Icon]) => (
          <MetricTile key={label} label={label} value={value} detail="Financial rollup" icon={Icon} tone="blue" />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <AdminPanel title="Plan and subscription mix" icon={Sparkles}>
          <div className="grid gap-4 md:grid-cols-2">
            <Breakdown title="Plans" data={overview?.breakdowns.plans ?? {}} />
            <Breakdown title="Subscription status" data={overview?.breakdowns.subscriptionStatus ?? {}} />
          </div>
        </AdminPanel>
        <AdminPanel title="Latest movement" icon={Activity}>
          <Timeline items={activityFeed.slice(0, 8)} />
        </AdminPanel>
      </section>
    </div>
  );
}

function CompaniesTab({
  companies,
  selectedCompany,
  planFilter,
  statusFilter,
  savingCompanyId,
  onPlanFilterChange,
  onStatusFilterChange,
  onSelectCompany,
  onUpdateCompany,
  onExportCompanies,
}: {
  companies: AdminRow[];
  selectedCompany: AdminRow | null;
  planFilter: string;
  statusFilter: string;
  savingCompanyId: string;
  onPlanFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSelectCompany: (value: string) => void;
  onUpdateCompany: (companyId: string, updates: Record<string, string>) => Promise<void>;
  onExportCompanies: () => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="min-w-0 rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Company manager</h2>
            <p className="mt-1 text-sm text-slate-500">Change plans, subscription states, and review workspace health.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={planFilter}
              onChange={(event) => onPlanFilterChange(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"
            >
              <option value="all">All plans</option>
              {planOptions.map((plan) => (
                <option key={plan} value={plan}>
                  {titleize(plan)}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {titleize(status)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onExportCompanies}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Billing</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.length ? (
                companies.map((company) => (
                  <tr
                    key={String(company.id)}
                    className="cursor-pointer text-slate-700 hover:bg-slate-50"
                    onClick={() => onSelectCompany(String(company.id))}
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950">{String(company.name ?? "Unnamed company")}</p>
                      <p className="text-xs text-slate-500">{String(company.id ?? "").slice(0, 8)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p>{String(company.email ?? "-")}</p>
                      <p className="text-xs text-slate-500">{String(company.phone ?? "-")}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill value={String(company.plan ?? "basic")} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill value={String(company.subscription_status ?? "inactive")} tone="amber" />
                    </td>
                    <td className="px-5 py-4">{String(company.billing_cycle ?? "-") || "-"}</td>
                    <td className="px-5 py-4">{formatDate(company.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-7 text-slate-500" colSpan={6}>
                    No companies match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <CompanyInspector
        company={selectedCompany}
        savingCompanyId={savingCompanyId}
        onUpdateCompany={onUpdateCompany}
      />
    </div>
  );
}

function CompanyInspector({
  company,
  savingCompanyId,
  onUpdateCompany,
}: {
  company: AdminRow | null;
  savingCompanyId: string;
  onUpdateCompany: (companyId: string, updates: Record<string, string>) => Promise<void>;
}) {
  if (!company) {
    return (
      <aside className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Select a company to manage it.
      </aside>
    );
  }

  const companyId = String(company.id);
  const isSaving = savingCompanyId === companyId;

  return (
    <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-blue-700">Selected workspace</p>
          <h3 className="mt-2 text-xl font-semibold">{String(company.name ?? "Company")}</h3>
          <p className="mt-1 text-sm text-slate-500">{String(company.email ?? "-")}</p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Building2 size={20} />
        </span>
      </div>

      <div className="mt-5 grid gap-4">
        <ControlSelect
          label="Plan"
          value={String(company.plan ?? "basic").toLowerCase()}
          options={planOptions}
          disabled={isSaving}
          onChange={(value) => onUpdateCompany(companyId, { plan: value })}
        />
        <ControlSelect
          label="Subscription status"
          value={String(company.subscription_status ?? "inactive").toLowerCase()}
          options={statusOptions}
          disabled={isSaving}
          onChange={(value) => onUpdateCompany(companyId, { subscriptionStatus: value })}
        />
        <ControlSelect
          label="Billing cycle"
          value={String(company.billing_cycle ?? "")}
          options={billingOptions}
          disabled={isSaving}
          onChange={(value) => onUpdateCompany(companyId, { billingCycle: value })}
        />
      </div>

      <div className="mt-5 grid gap-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => onUpdateCompany(companyId, { plan: "ultra", subscriptionStatus: "active", billingCycle: "monthly" })}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Sparkles size={17} />
          Give Ultra access
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => onUpdateCompany(companyId, { subscriptionStatus: "inactive" })}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
        >
          <AlertTriangle size={17} />
          Mark inactive
        </button>
      </div>

      <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-5 text-sm">
        <InfoRow label="Phone" value={String(company.phone ?? "-")} />
        <InfoRow label="Created" value={formatDate(company.created_at)} />
        <InfoRow label="Company ID" value={companyId} />
      </dl>
    </aside>
  );
}

function UsersTab({ users, overview }: { users: AdminRow[]; overview: AdminOverview | null }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <AdminTable
        title="Auth users"
        columns={["Email", "Created", "Last sign in"]}
        rows={users.map((row) => [
          String(row.email ?? "-"),
          formatDate(row.created_at),
          formatDate(row.last_sign_in_at),
        ])}
      />
      <AdminPanel title="User signals" icon={Users}>
        <div className="grid gap-3">
          <Signal label="Total users" value={String(overview?.recentUsers.length ?? 0)} />
          <Signal
            label="Recently signed in"
            value={String((overview?.recentUsers ?? []).filter((row) => row.last_sign_in_at).length)}
          />
          <Signal label="Company profiles" value={String(overview?.counts.profiles ?? 0)} />
        </div>
      </AdminPanel>
    </div>
  );
}

function EmailTab({ overview, onSent }: { overview: AdminOverview | null; onSent: () => Promise<void> }) {
  const router = useRouter();
  const [emailType, setEmailType] = useState("custom");
  const [recipient, setRecipient] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [companyNameValue, setCompanyNameValue] = useState("");
  const [subject, setSubject] = useState("A quick update from Comvexa");
  const [message, setMessage] = useState(
    "Thanks for using Comvexa. We wanted to send you a quick update about your workspace.",
  );
  const [ctaLabel, setCtaLabel] = useState("Open Comvexa");
  const [ctaUrl, setCtaUrl] = useState("https://comvexa.net/login");
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  const customersWithEmail = useMemo(
    () => (overview?.recentCustomers ?? []).filter((customer) => String(customer.email ?? "").includes("@")),
    [overview],
  );
  const selectedTemplate = emailTemplates.find((template) => template.id === emailType) ?? emailTemplates[0];

  function applyTemplate(value: string) {
    const template = emailTemplates.find((item) => item.id === value) ?? emailTemplates[0];
    setEmailType(template.id);
    setSubject(template.subject);
    setMessage(template.message);
    setCtaLabel(template.ctaLabel);
    setCtaUrl(template.ctaUrl);
  }

  function chooseCustomer(value: string) {
    if (!value) {
      return;
    }

    const customer = customersWithEmail.find((row) => String(row.id) === value);

    if (!customer) {
      return;
    }

    setRecipient(String(customer.email ?? ""));
    setCustomerName(String(customer.name ?? ""));
    setCompanyNameValue(companyName(customer));
  }

  async function sendCustomerEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setIsSending(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.replace("/login");
      return;
    }

    const response = await fetch("/api/admin/send-email", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emailType,
        to: recipient,
        customerName,
        companyName: companyNameValue,
        subject,
        message,
        ctaLabel,
        ctaUrl,
      }),
    });
    const data = await response.json();
    setIsSending(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not send email.");
      return;
    }

    setStatus(emailType === "password_reset" ? "Password reset email sent." : `Email sent${data.id ? `: ${data.id}` : "."}`);
    await onSent();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-blue-700">Customer email</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal">Send a branded Comvexa email</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Choose a recent customer or type any email address. This sends through Resend using the same Comvexa
              email design.
            </p>
          </div>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Mail size={22} />
          </span>
        </div>

        <form onSubmit={sendCustomerEmail} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Email type
            <select
              value={emailType}
              onChange={(event) => applyTemplate(event.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-3 font-semibold text-slate-950"
            >
              {emailTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Pick recent customer
            <select
              defaultValue=""
              onChange={(event) => chooseCustomer(event.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-3 font-semibold text-slate-950"
            >
              <option value="">Manual recipient</option>
              {customersWithEmail.map((customer) => (
                <option key={String(customer.id)} value={String(customer.id)}>
                  {String(customer.name ?? "Customer")} - {String(customer.email ?? "")}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Customer email" value={recipient} onChange={setRecipient} type="email" required />
            <TextField label="Customer name" value={customerName} onChange={setCustomerName} />
            <TextField label="Company name" value={companyNameValue} onChange={setCompanyNameValue} />
            <TextField label="Subject" value={subject} onChange={setSubject} required />
          </div>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              rows={8}
              className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none focus:border-emerald-300"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Button label" value={ctaLabel} onChange={setCtaLabel} />
            <TextField label="Button URL" value={ctaUrl} onChange={setCtaUrl} type="url" />
          </div>

          {emailType === "password_reset" ? (
            <p className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              Password reset uses Supabase Auth and sends the official reset link to /reset-password.
            </p>
          ) : null}

          {status ? (
            <p
              className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                status.toLowerCase().includes("sent")
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {status}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSending}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            <Mail size={17} />
            {isSending ? "Sending..." : emailType === "password_reset" ? "Send reset email" : "Send email"}
          </button>
        </form>
      </section>

      <aside className="space-y-5">
        <AdminPanel title="Email preview" icon={Mail}>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="bg-[#10233f] px-5 py-4 text-white">
              <p className="text-lg font-semibold">Comvexa</p>
              <p className="text-xs text-slate-300">Global operations suite</p>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-semibold">{subject || "Email subject"}</h3>
              <p className="mt-1 text-xs font-semibold uppercase text-emerald-700">{selectedTemplate.label}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {customerName ? `Hi ${customerName},\n\n` : ""}
                {message || "Your message will appear here."}
              </p>
              {ctaLabel && ctaUrl ? (
                <a
                  href={ctaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  {ctaLabel}
                </a>
              ) : null}
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="Recent email logs" icon={Activity}>
          <Timeline
            items={(overview?.recentEmailLogs ?? []).slice(0, 6).map((row) => ({
              type: String(row.email_type ?? "Email"),
              title: String(row.subject ?? "Email"),
              detail: `${String(row.recipient ?? "-")} - ${String(row.status ?? "-")}`,
              date: row.created_at,
            }))}
          />
        </AdminPanel>
      </aside>
    </div>
  );
}

function ActivityTab({
  overview,
  activityFeed,
  financialCards,
}: {
  overview: AdminOverview | null;
  activityFeed: Array<{ type: string; title: string; detail: string; date: unknown }>;
  financialCards: Array<[string, string, LucideIcon]>;
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <AdminPanel title="Activity last 30 days" icon={TrendingUp}>
          <div className="space-y-3">
            {Object.entries(overview?.activityLast30Days ?? {}).map(([label, value]) => (
              <ProgressRow
                key={label}
                label={titleize(label)}
                value={value}
                max={Math.max(...Object.values(overview?.activityLast30Days ?? { 1: 1 }))}
              />
            ))}
          </div>
        </AdminPanel>
        <AdminPanel title="Activity feed" icon={Activity}>
          <Timeline items={activityFeed} />
        </AdminPanel>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        {financialCards.map(([label, value, Icon]) => (
          <MetricTile key={label} label={label} value={value} detail="Current admin sample" icon={Icon} tone="blue" />
        ))}
      </section>
      <AdminTable
        title="Email logs"
        columns={["Recipient", "Type", "Subject", "Status", "Created"]}
        rows={(overview?.recentEmailLogs ?? []).map((row) => [
          String(row.recipient ?? "-"),
          String(row.email_type ?? "-"),
          String(row.subject ?? "-"),
          String(row.status ?? "-"),
          formatDate(row.created_at),
        ])}
      />
    </div>
  );
}

function ToolsTab({ overview, onRefresh }: { overview: AdminOverview | null; onRefresh: () => void }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <AdminPanel title="Launch checklist" icon={ClipboardList}>
        <ChecklistItem done label="SUPABASE_SERVICE_ROLE_KEY added on Vercel" />
        <ChecklistItem done label="RESEND_API_KEY added on Vercel" />
        <ChecklistItem done label="EMAIL_FROM uses Comvexa no-reply sender" />
        <ChecklistItem done={Boolean(overview?.counts.companies)} label="At least one company has signed up" />
        <ChecklistItem done={Boolean(overview?.recentEmailLogs?.length)} label="Email logs table is receiving records" />
      </AdminPanel>
      <AdminPanel title="Quick links" icon={ExternalLink}>
        <div className="grid gap-3">
          <ToolLink href="/dashboard" label="Open customer dashboard" detail="Preview the normal workspace experience" />
          <ToolLink href="/dashboard/subscription" label="Open subscription page" detail="Check plans, trials, and payment flow" />
          <ToolLink href="/api/test-email" label="Run test email route" detail="Requires EMAIL_TEST_SECRET if configured" />
          <ToolLink href="https://supabase.com/dashboard" label="Open Supabase" detail="Manage Auth, SMTP, and database" external />
          <ToolLink href="https://vercel.com/dashboard" label="Open Vercel" detail="Manage production env vars and deploys" external />
        </div>
      </AdminPanel>
      <AdminPanel title="Database modules" icon={Database}>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "companies",
            "customers",
            "employees",
            "bookings",
            "tasks",
            "invoices",
            "payments",
            "expenses",
            "documents",
            "inventory",
            "branches",
            "email_logs",
          ].map((name) => (
            <span key={name} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold">
              {name}
            </span>
          ))}
        </div>
      </AdminPanel>
      <AdminPanel title="Admin actions" icon={LifeBuoy}>
        <div className="grid gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            <RefreshCw size={17} />
            Reload all admin data
          </button>
          <p className="text-sm leading-6 text-slate-600">
            This admin area is read-heavy by design, with company plan/status controls enabled. Destructive actions like
            deleting users or workspaces should stay in Supabase until we add confirmation flows and audit logs.
          </p>
        </div>
      </AdminPanel>
    </div>
  );
}

function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
  tone = "emerald",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "emerald" | "blue";
}) {
  const toneClass = tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-normal">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
        <span className={`flex size-11 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
}

function AdminPanel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Icon size={18} className="text-emerald-700" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Breakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;

  return (
    <div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <div className="mt-3 space-y-3">
        {entries.length ? (
          entries.map(([label, value]) => <ProgressRow key={label} label={titleize(label)} value={value} max={total} />)
        ) : (
          <p className="text-sm text-slate-500">No data yet.</p>
        )}
      </div>
    </div>
  );
}

function ProgressRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(6, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-950">{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function Timeline({ items }: { items: Array<{ type: string; title: string; detail: string; date: unknown }> }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">No recent activity yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.type}-${item.title}-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
          <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 ring-1 ring-slate-200">
            <Activity size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-slate-500">{item.type}</p>
            <p className="truncate font-semibold text-slate-950">{item.title}</p>
            <p className="truncate text-sm text-slate-500">{item.detail}</p>
            <p className="mt-1 text-xs text-slate-400">{formatDate(item.date)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminTable({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-5 py-3">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={`${title}-${index}`} className="text-slate-700">
                  {row.map((cell, cellIndex) => (
                    <td key={`${title}-${index}-${cellIndex}`} className="px-5 py-4">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-5 py-6 text-slate-500" colSpan={columns.length}>
                  No records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ControlSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border border-slate-200 bg-white px-3 font-semibold text-slate-950 disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option || "none"} value={option}>
            {option ? titleize(option) : "None"}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        required={required}
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-300"
      />
    </label>
  );
}

function StatusPill({ value, tone = "emerald" }: { value: string; tone?: "emerald" | "amber" }) {
  const toneClass =
    tone === "amber"
      ? "bg-amber-50 text-amber-700 ring-amber-100"
      : "bg-emerald-50 text-emerald-700 ring-emerald-100";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${toneClass}`}>
      {titleize(value)}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-slate-700">{value}</dd>
    </div>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className={done ? "text-emerald-600" : "text-amber-600"}>
        {done ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
      </span>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </div>
  );
}

function ToolLink({ href, label, detail, external }: { href: string; label: string; detail: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-white"
    >
      <span>
        <span className="block text-sm font-semibold text-slate-950">{label}</span>
        <span className="block text-xs text-slate-500">{detail}</span>
      </span>
      <ExternalLink size={16} className="text-slate-400" />
    </a>
  );
}
