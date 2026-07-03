"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  LogOut,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { isAdminEmail } from "@/src/lib/admin/access";
import { supabase } from "@/src/lib/supabase/client";

type AdminOverview = {
  adminEmail: string;
  counts: Record<string, number>;
  recentCompanies: Array<Record<string, unknown>>;
  recentCustomers: Array<Record<string, unknown>>;
  recentInvoices: Array<Record<string, unknown>>;
  recentPayments: Array<Record<string, unknown>>;
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
      ["Invoices", counts.invoices ?? 0, ReceiptText],
      ["Payments", counts.payments ?? 0, CreditCard],
      ["Documents", counts.documents ?? 0, FileText],
      ["Tasks", counts.tasks ?? 0, BarChart3],
      ["Branches", counts.branches ?? 0, Building2],
    ] satisfies Array<[string, number, LucideIcon]>;
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <AdminTable
            title="Recent companies"
            columns={["Company", "Plan", "Status", "Created"]}
            rows={(overview?.recentCompanies ?? []).map((row) => [
              String(row.name ?? "Unnamed company"),
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
              `$${Number(row.total_amount ?? 0).toLocaleString()}`,
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
