"use client";

import { useEffect, useState } from "react";
import { BarChart3, Building2, CalendarDays, CircleDollarSign, ListChecks, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
import { PaymentGate } from "../_components/payment-gate";

type AmountRow = {
  amount?: number | null;
  total_amount?: number | null;
  tax_amount?: number | null;
  payment_status?: string | null;
};

function money(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function ReportsPage() {
  return (
    <PaymentGate>
      <ReportsContent />
    </PaymentGate>
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

  useEffect(() => {
    async function loadReports() {
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
    return () => window.clearTimeout(timeout);
  }, []);

  const profit = metrics.income - metrics.expenses;
  const cashFlow = metrics.income - metrics.expenses - metrics.supplierBills;

  const cards = [
    ["Recorded income", money(metrics.income), "From payment records", CircleDollarSign],
    ["Expenses", money(metrics.expenses), "Business expenses entered", WalletCards],
    ["Profit / loss", money(profit), "Income minus expenses", TrendingUp],
    ["Cash flow", money(cashFlow), "Income minus expenses and bills", BarChart3],
    ["Invoice total", money(metrics.invoiceTotal), "All invoice records", ReceiptText],
    ["Unpaid invoices", money(metrics.unpaidInvoices), "Receivables to follow up", ReceiptText],
    ["Supplier bills", money(metrics.supplierBills), "Payables recorded", Building2],
    ["Tax tracked", money(metrics.tax), "Tax amounts from expenses", ReceiptText],
    ["Customers", String(metrics.customers), "Customer records", Building2],
    ["Tasks", String(metrics.tasks), "Operational work", ListChecks],
    ["Bookings", String(metrics.bookings), "Appointment records", CalendarDays],
  ];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Live Comvexa reports
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">Reports</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Live summaries from your company records. Add invoices, payments,
          expenses, supplier bills, bookings, tasks, and customers to build out
          these reports.
        </p>
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
            <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">{String(value)}</p>
            <p className="mt-2 text-sm text-slate-500">{String(note)}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
