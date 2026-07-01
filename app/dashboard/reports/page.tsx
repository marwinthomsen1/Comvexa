"use client";

import { useEffect, useState } from "react";
import { BarChart3, Building2, CalendarDays, CircleDollarSign, ListChecks, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
import { formatCurrencyAmount } from "@/app/_components/currency-display";
import { PlanGate } from "../_components/plan-gate";

type AmountRow = {
  amount?: number | null;
  total_amount?: number | null;
  tax_amount?: number | null;
  payment_status?: string | null;
};

const defaultReportSettings = {
  currency: "USD",
};

function readReportSettings() {
  try {
    const saved = window.localStorage.getItem("comvexa-workspace-settings");
    return saved ? { ...defaultReportSettings, ...JSON.parse(saved) } : defaultReportSettings;
  } catch {
    return defaultReportSettings;
  }
}

function money(value: number, currency: string) {
  return formatCurrencyAmount(value, currency, false, 2);
}

export default function ReportsPage() {
  return (
    <PlanGate moduleName="Reports">
      <ReportsContent />
    </PlanGate>
  );
}

function ReportsContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    customers: 0,
    tasks: 0,
    bookings: 0,
    income: 0,
    invoiceTotal: 0,
    unpaidInvoices: 0,
    expenses: 0,
    tax: 0,
    supplierBills: 0,
  });
  const [currency, setCurrency] = useState(defaultReportSettings.currency);

  useEffect(() => {
    async function loadReports() {
      setCurrency(readReportSettings().currency);
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) {
        setIsLoading(false);
        return;
      }

      const companyId = profile.company_id;
      const [customers, tasks, bookings, payments, invoices, expenses, supplierBills] = await Promise.all([
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("payments").select("amount").eq("company_id", companyId),
        supabase.from("invoices").select("total_amount, payment_status").eq("company_id", companyId),
        supabase.from("expenses").select("amount, tax_amount").eq("company_id", companyId),
        supabase.from("supplier_bills").select("total_amount, payment_status").eq("company_id", companyId),
      ]);

      const paymentRows = (payments.data ?? []) as AmountRow[];
      const invoiceRows = (invoices.data ?? []) as AmountRow[];
      const expenseRows = (expenses.data ?? []) as AmountRow[];
      const supplierBillRows = (supplierBills.data ?? []) as AmountRow[];

      setMetrics({
        customers: customers.count ?? 0,
        tasks: tasks.count ?? 0,
        bookings: bookings.count ?? 0,
        income: paymentRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
        invoiceTotal: invoiceRows.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0),
        unpaidInvoices: invoiceRows
          .filter((row) => row.payment_status !== "paid")
          .reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0),
        expenses: expenseRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
        tax: expenseRows.reduce((sum, row) => sum + Number(row.tax_amount ?? 0), 0),
        supplierBills: supplierBillRows.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0),
      });
      setIsLoading(false);
    }

    const timeout = window.setTimeout(loadReports, 0);
    function syncSettings() {
      setCurrency(readReportSettings().currency);
    }

    window.addEventListener("storage", syncSettings);
    window.addEventListener("comvexa-settings-change", syncSettings);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("storage", syncSettings);
      window.removeEventListener("comvexa-settings-change", syncSettings);
    };
  }, []);

  const profit = metrics.income - metrics.expenses;
  const cashFlow = metrics.income - metrics.expenses - metrics.supplierBills;
  const collectionRate = metrics.invoiceTotal > 0
    ? Math.round(((metrics.invoiceTotal - metrics.unpaidInvoices) / metrics.invoiceTotal) * 100)
    : 0;
  const operatingLoad = metrics.tasks + metrics.bookings;

  const cards = [
    ["Recorded income", money(metrics.income, currency), "From payment records", CircleDollarSign],
    ["Expenses", money(metrics.expenses, currency), "Business expenses entered", WalletCards],
    ["Profit / loss", money(profit, currency), "Income minus expenses", TrendingUp],
    ["Cash flow", money(cashFlow, currency), "Income minus expenses and bills", BarChart3],
    ["Invoice total", money(metrics.invoiceTotal, currency), "All invoice records", ReceiptText],
    ["Unpaid invoices", money(metrics.unpaidInvoices, currency), "Receivables to follow up", ReceiptText],
    ["Supplier bills", money(metrics.supplierBills, currency), "Payables recorded", Building2],
    ["Tax tracked", money(metrics.tax, currency), "Tax amounts from expenses", ReceiptText],
    ["Collection rate", `${collectionRate}%`, "Invoices marked collected", TrendingUp],
    ["Operating load", String(operatingLoad), "Tasks plus bookings", BarChart3],
    ["Customers", String(metrics.customers), "Customer records", Building2],
    ["Tasks", String(metrics.tasks), "Operational work", ListChecks],
    ["Bookings", String(metrics.bookings), "Appointment records", CalendarDays],
  ];

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="grid gap-0 xl:grid-cols-[1fr_380px]">
          <div className="bg-gradient-to-br from-white via-slate-50 to-emerald-50/70 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Business intelligence
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">Reports</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Live summaries from company records. Add invoices, payments,
              expenses, supplier bills, bookings, tasks, and customers to build
              out operational and finance reporting.
            </p>
          </div>
          <div className="border-t border-slate-200 p-6 xl:border-l xl:border-t-0 sm:p-8">
            <p className="text-sm font-semibold text-slate-950">Executive snapshot</p>
            <p className="mt-4 text-4xl font-semibold tracking-normal text-slate-950" data-no-translate>
              {isLoading ? "-" : money(profit, currency)}
            </p>
            <p className="mt-2 text-sm text-slate-500">Current profit / loss</p>
            <div className="mt-5 h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${profit >= 0 ? "bg-emerald-600" : "bg-red-500"}`}
                style={{ width: `${Math.min(100, Math.max(12, collectionRate))}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-500">{collectionRate}% collection rate</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, note, Icon]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <Icon size={20} />
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {isLoading ? "Loading" : "Live"}
              </span>
            </div>
            <p className="mt-5 text-sm font-medium text-slate-500">{String(label)}</p>
            <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950" data-no-translate>
              {String(value)}
            </p>
            <p className="mt-2 text-sm text-slate-500">{String(note)}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
