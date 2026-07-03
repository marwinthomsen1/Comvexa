"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarClock,
  CreditCard,
  DollarSign,
  FileText,
  HandCoins,
  LogOut,
  Package,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  WalletCards,
  Users,
  type LucideIcon,
} from "lucide-react";
import { isAdminEmail } from "@/src/lib/admin/access";
import { supabase } from "@/src/lib/supabase/client";

type AdminOverview = {
  adminEmail: string;
  counts: Record<string, number>;
  financials: Record<string, number>;
  breakdowns: Record<string, Record<string, number>>;
  alerts: Record<string, number>;
  activityLast30Days: Record<string, number>;
  topCompanies: Array<Record<string, unknown>>;
  recentCompanies: Array<Record<string, unknown>>;
  recentCustomers: Array<Record<string, unknown>>;
  recentInvoices: Array<Record<string, unknown>>;
  recentPayments: Array<Record<string, unknown>>;
  recentExpenses: Array<Record<string, unknown>>;
  recentSupplierBills: Array<Record<string, unknown>>;
  recentTasks: Array<Record<string, unknown>>;
  recentBookings: Array<Record<string, unknown>>;
  recentEmployees: Array<Record<string, unknown>>;
  recentDocuments: Array<Record<string, unknown>>;
  recentInventory: Array<Record<string, unknown>>;
  recentBranches: Array<Record<string, unknown>>;
  recentUsers: Array<Record<string, unknown>>;
};

function companyName(row: Record<string, unknown>) {
  const company = row.companies;

  if (Array.isArray(company)) {
    return String((company[0] as Record<string, unknown> | undefined)?.name ?? "Company");
  }

  if (company && typeof company === "object") {
    return String((company as Record<string, unknown>).name ?? "Company");
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

export function AdminDashboard() {
  const router = useRouter();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
  }, [router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadOverview();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadOverview]);

  const metrics = useMemo(() => {
    const counts = overview?.counts ?? {};

    return [
      ["Companies", counts.companies ?? 0, Building2],
      ["Users", counts.profiles ?? 0, Users],
      ["Customers", counts.customers ?? 0, Users],
      ["Employees", counts.employees ?? 0, Users],
      ["Invoices", counts.invoices ?? 0, ReceiptText],
      ["Payments", counts.payments ?? 0, CreditCard],
      ["Expenses", counts.expenses ?? 0, HandCoins],
      ["Documents", counts.documents ?? 0, FileText],
      ["Tasks", counts.tasks ?? 0, BarChart3],
      ["Bookings", counts.bookings ?? 0, CalendarClock],
      ["Inventory", counts.inventory_items ?? 0, Package],
      ["Branches", counts.branches ?? 0, Building2],
    ] satisfies Array<[string, number, LucideIcon]>;
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
      ["Overdue invoices", alerts.overdueInvoices ?? 0],
      ["Supplier bills due", alerts.upcomingSupplierBills ?? 0],
      ["Low stock items", alerts.lowStockItems ?? 0],
      ["Open tasks", alerts.openTasks ?? 0],
    ] satisfies Array<[string, number]>;
  }, [overview]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-600 shadow-sm">
          Loading admin dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-100">
              <ShieldCheck size={14} />
              Admin
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal">Comvexa admin dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">
              Signed in as {overview?.adminEmail ?? "admin"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={loadOverview}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {error ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metrics.map(([label, value, Icon]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-500">{String(label)}</p>
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <Icon size={19} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-normal">{String(value)}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {financialCards.map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-normal">{value}</p>
                </div>
                <span className="flex size-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                  <Icon size={20} />
                </span>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <AdminPanel title="Plan and subscription mix">
            <div className="grid gap-4 md:grid-cols-2">
              <Breakdown title="Plans" data={overview?.breakdowns.plans ?? {}} />
              <Breakdown title="Subscription status" data={overview?.breakdowns.subscriptionStatus ?? {}} />
            </div>
          </AdminPanel>
          <AdminPanel title="Needs attention">
            <div className="grid gap-3 sm:grid-cols-2">
              {alertCards.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </AdminPanel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <AdminPanel title="Activity last 30 days">
            <div className="space-y-3">
              {Object.entries(overview?.activityLast30Days ?? {}).map(([label, value]) => (
                <ProgressRow key={label} label={titleize(label)} value={value} max={Math.max(...Object.values(overview?.activityLast30Days ?? { 1: 1 }))} />
              ))}
            </div>
          </AdminPanel>
          <AdminPanel title="Most active companies">
            <div className="grid gap-3 sm:grid-cols-2">
              {(overview?.topCompanies ?? []).map((company, index) => (
                <div key={`${company.name}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-950">{String(company.name ?? "Company")}</p>
                  <p className="mt-1 text-sm text-slate-500">{String(company.activity ?? 0)} recent records</p>
                </div>
              ))}
            </div>
          </AdminPanel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <AdminTable
            title="Recent companies"
            columns={["Company", "Email", "Plan", "Status", "Created"]}
            rows={(overview?.recentCompanies ?? []).map((row) => [
              String(row.name ?? "Unnamed company"),
              String(row.email ?? "-"),
              String(row.plan ?? "-"),
              String(row.subscription_status ?? "-"),
              formatDate(row.created_at),
            ])}
          />
          <AdminTable
            title="Recent customers"
            columns={["Customer", "Company", "Email", "Created"]}
            rows={(overview?.recentCustomers ?? []).map((row) => [
              String(row.name ?? "Unnamed customer"),
              companyName(row),
              String(row.email ?? "-"),
              formatDate(row.created_at),
            ])}
          />
          <AdminTable
            title="Recent invoices"
            columns={["Invoice", "Company", "Status", "Amount"]}
            rows={(overview?.recentInvoices ?? []).map((row) => [
              String(row.invoice_number ?? "Invoice"),
              companyName(row),
              String(row.payment_status ?? "-"),
              money(row.total_amount),
            ])}
          />
          <AdminTable
            title="Recent payments"
            columns={["Company", "Method", "Date", "Amount"]}
            rows={(overview?.recentPayments ?? []).map((row) => [
              companyName(row),
              String(row.payment_method ?? "-"),
              formatDate(row.payment_date ?? row.created_at),
              money(row.amount),
            ])}
          />
          <AdminTable
            title="Recent employees"
            columns={["Employee", "Company", "Department", "Status"]}
            rows={(overview?.recentEmployees ?? []).map((row) => [
              String(row.name ?? "Employee"),
              companyName(row),
              String(row.department ?? "-"),
              String(row.status ?? "-"),
            ])}
          />
          <AdminTable
            title="Recent tasks"
            columns={["Task", "Company", "Priority", "Status"]}
            rows={(overview?.recentTasks ?? []).map((row) => [
              String(row.title ?? "Task"),
              companyName(row),
              String(row.priority ?? "-"),
              String(row.status ?? "-"),
            ])}
          />
          <AdminTable
            title="Recent bookings"
            columns={["Company", "Date", "Time", "Status"]}
            rows={(overview?.recentBookings ?? []).map((row) => [
              companyName(row),
              formatDate(row.booking_date ?? row.created_at),
              `${String(row.start_time ?? "-")} - ${String(row.end_time ?? "-")}`,
              String(row.status ?? "-"),
            ])}
          />
          <AdminTable
            title="Recent expenses"
            columns={["Expense", "Company", "Category", "Amount"]}
            rows={(overview?.recentExpenses ?? []).map((row) => [
              String(row.title ?? "Expense"),
              companyName(row),
              String(row.category ?? "-"),
              money(row.amount),
            ])}
          />
          <AdminTable
            title="Supplier bills"
            columns={["Supplier", "Company", "Status", "Amount"]}
            rows={(overview?.recentSupplierBills ?? []).map((row) => [
              String(row.supplier_name ?? "Supplier"),
              companyName(row),
              String(row.payment_status ?? "-"),
              money(row.total_amount),
            ])}
          />
          <AdminTable
            title="Documents"
            columns={["Document", "Company", "Type", "Expiry"]}
            rows={(overview?.recentDocuments ?? []).map((row) => [
              String(row.title ?? "Document"),
              companyName(row),
              String(row.document_type ?? "-"),
              formatDate(row.expiry_date),
            ])}
          />
          <AdminTable
            title="Inventory"
            columns={["Item", "Company", "Quantity", "Supplier"]}
            rows={(overview?.recentInventory ?? []).map((row) => [
              String(row.name ?? "Item"),
              companyName(row),
              `${String(row.quantity ?? 0)} ${String(row.unit ?? "")}`.trim(),
              String(row.supplier ?? "-"),
            ])}
          />
          <AdminTable
            title="Branches"
            columns={["Branch", "Company", "Phone", "Created"]}
            rows={(overview?.recentBranches ?? []).map((row) => [
              String(row.name ?? "Branch"),
              companyName(row),
              String(row.phone ?? "-"),
              formatDate(row.created_at),
            ])}
          />
          <AdminTable
            title="Recent users"
            columns={["Email", "Created", "Last sign in"]}
            rows={(overview?.recentUsers ?? []).map((row) => [
              String(row.email ?? "-"),
              formatDate(row.created_at),
              formatDate(row.last_sign_in_at),
            ])}
          />
        </section>
      </div>
    </main>
  );
}

function AdminPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <TrendingUp size={18} className="text-emerald-700" />
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
          entries.map(([label, value]) => (
            <ProgressRow key={label} label={titleize(label)} value={value} max={total} />
          ))
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

function AdminTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-widest text-slate-500">
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
