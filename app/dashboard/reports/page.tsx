"use client";

import { ReactNode, useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, ListChecks, ReceiptText, Users, WalletCards } from "lucide-react";
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

  const maxFinancialValue = Math.max(metrics.income, metrics.expenses, metrics.supplierBills, metrics.invoiceTotal, 1);
  const reportDate = new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(new Date());

  return (
    <main className="report-intelligence-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="dashboard-custom-hero report-editorial-brief overflow-hidden rounded-[2rem] border border-[#d8d0c4] bg-[#f4efe6] shadow-sm">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_340px_280px]">
          <div className="border-b border-[#d8d0c4] p-6 sm:p-8 xl:border-b-0 xl:border-r">
            <div className="flex items-center gap-2 text-[#a6452d]"><BarChart3 size={17} /><p className="text-xs font-bold uppercase tracking-[0.2em]">Executive intelligence</p></div>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-[#211f1c] sm:text-5xl">The state of your business, at a glance.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6d675f]">A live briefing built from payments, invoices, costs, customers, bookings, and operational work across your workspace.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-[#7f776e]"><span className="rounded-full border border-[#d8d0c4] bg-white/60 px-3 py-1.5">As of {reportDate}</span><span className="inline-flex items-center gap-1.5"><span className={`size-2 rounded-full ${isLoading ? "bg-amber-400" : "bg-emerald-500"}`} />{isLoading ? "Refreshing records" : "Live workspace data"}</span></div>
          </div>
          <div className="border-b border-[#d8d0c4] p-6 sm:p-8 xl:border-b-0 xl:border-r"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a8176]">Net performance</p><div className="mt-5 flex items-start justify-between gap-3"><div><p className={`text-4xl font-semibold tracking-tight ${profit >= 0 ? "text-[#176b52]" : "text-red-700"}`} data-no-translate>{isLoading ? "—" : money(profit, currency)}</p><p className="mt-2 text-sm text-[#766f66]">Income minus operating expenses</p></div><span className={`grid size-11 shrink-0 place-items-center rounded-full ${profit >= 0 ? "bg-[#dceee7] text-[#176b52]" : "bg-red-100 text-red-700"}`}>{profit >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}</span></div><div className="mt-8 grid grid-cols-2 gap-3"><div className="border-l-2 border-[#176b52] pl-3"><p className="text-[10px] font-bold uppercase text-[#8a8176]">Income</p><p className="mt-1 text-sm font-semibold text-[#211f1c]" data-no-translate>{isLoading ? "—" : money(metrics.income, currency)}</p></div><div className="border-l-2 border-[#c77255] pl-3"><p className="text-[10px] font-bold uppercase text-[#8a8176]">Expenses</p><p className="mt-1 text-sm font-semibold text-[#211f1c]" data-no-translate>{isLoading ? "—" : money(metrics.expenses, currency)}</p></div></div></div>
          <div className="grid place-items-center p-6 sm:p-8"><div className="text-center"><div className="relative mx-auto grid size-36 place-items-center rounded-full" style={{ background: `conic-gradient(#a6452d ${collectionRate * 3.6}deg, #ded7cb 0deg)` }}><div className="grid size-[6.75rem] place-items-center rounded-full bg-[#f4efe6]"><div><p className="text-3xl font-semibold text-[#211f1c]">{isLoading ? "—" : `${collectionRate}%`}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[#8a8176]">Collected</p></div></div></div><p className="mt-4 text-sm font-semibold text-[#292620]">Invoice collection</p><p className="mt-1 text-xs text-[#7d766d]">{money(metrics.unpaidInvoices, currency)} still outstanding</p></div></div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
        <div className="report-finance-ledger rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#a6452d]">Financial ledger</p><h3 className="mt-1 text-xl font-semibold text-slate-950">Money moving through the business</h3></div><span className="w-fit rounded-full bg-[#f4efe6] px-3 py-1.5 text-xs font-semibold text-[#6d675f]">All-time records</span></div>
          <div className="mt-7 space-y-5"><ReportBar label="Invoices issued" value={metrics.invoiceTotal} maximum={maxFinancialValue} display={money(metrics.invoiceTotal, currency)} tone="navy" /><ReportBar label="Payments received" value={metrics.income} maximum={maxFinancialValue} display={money(metrics.income, currency)} tone="green" /><ReportBar label="Operating expenses" value={metrics.expenses} maximum={maxFinancialValue} display={money(metrics.expenses, currency)} tone="orange" /><ReportBar label="Supplier commitments" value={metrics.supplierBills} maximum={maxFinancialValue} display={money(metrics.supplierBills, currency)} tone="gold" /></div>
          <div className="mt-7 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3"><ReportKpi label="Cash position" value={money(cashFlow, currency)} icon={<CircleDollarSign size={18} />} note="After expenses and bills" tone={cashFlow >= 0 ? "green" : "red"} /><ReportKpi label="Outstanding" value={money(metrics.unpaidInvoices, currency)} icon={<ReceiptText size={18} />} note="Unpaid invoice value" tone="orange" /><ReportKpi label="Tax tracked" value={money(metrics.tax, currency)} icon={<WalletCards size={18} />} note="From expense records" tone="navy" /></div>
        </div>

        <aside className="report-action-brief rounded-[2rem] bg-[#202a35] p-5 text-white shadow-lg sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#e4ad97]">Management brief</p><h3 className="mt-2 text-xl font-semibold text-white">What needs attention</h3></div><Clock3 size={21} className="text-[#e4ad97]" /></div><div className="mt-6 space-y-3"><ReportPriority title="Collect receivables" detail={`${money(metrics.unpaidInvoices, currency)} remains unpaid`} urgent={metrics.unpaidInvoices > 0} /><ReportPriority title="Review supplier exposure" detail={`${money(metrics.supplierBills, currency)} in recorded bills`} urgent={metrics.supplierBills > metrics.income} /><ReportPriority title="Protect cash flow" detail={`${money(cashFlow, currency)} after current costs`} urgent={cashFlow < 0} /></div><div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-white">Operating load</p><span className="text-xl font-semibold text-white">{operatingLoad}</span></div><p className="mt-2 text-[11px] leading-5 text-slate-400">Combined open task and booking activity recorded in the workspace.</p></div></aside>
      </section>

      <section className="report-operations-strip mt-5 rounded-[2rem] border border-[#d8d0c4] bg-[#f4efe6] p-5 sm:p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#176b52]">Operational pulse</p><h3 className="mt-1 text-xl font-semibold text-[#211f1c]">Activity beyond the balance sheet</h3></div><p className="text-xs text-[#7d766d]">Live totals from company records</p></div><div className="mt-5 grid gap-3 md:grid-cols-3"><OperationalSignal label="Customers" value={metrics.customers} note="Relationships on record" icon={<Users size={20} />} /><OperationalSignal label="Tasks" value={metrics.tasks} note="Pieces of operational work" icon={<ListChecks size={20} />} /><OperationalSignal label="Bookings" value={metrics.bookings} note="Scheduled appointments" icon={<CalendarDays size={20} />} /></div></section>
    </main>
  );
}

function ReportBar({ label, value, maximum, display, tone }: { label: string; value: number; maximum: number; display: string; tone: "navy" | "green" | "orange" | "gold" }) {
  const tones = { navy: "bg-[#25384a]", green: "bg-[#2b8065]", orange: "bg-[#c77255]", gold: "bg-[#c49a45]" };
  return <div><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-slate-600">{label}</p><p className="text-sm font-semibold text-slate-950" data-no-translate>{display}</p></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${value ? Math.max(4, (value / maximum) * 100) : 0}%` }} /></div></div>;
}

function ReportKpi({ label, value, icon, note, tone }: { label: string; value: string; icon: ReactNode; note: string; tone: "green" | "red" | "orange" | "navy" }) {
  const tones = { green: "bg-emerald-50 text-emerald-700", red: "bg-red-50 text-red-700", orange: "bg-orange-50 text-orange-700", navy: "bg-slate-100 text-slate-700" };
  return <div className="rounded-2xl border border-slate-200 p-4"><span className={`grid size-9 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span><p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 truncate text-lg font-semibold text-slate-950" data-no-translate>{value}</p><p className="mt-1 truncate text-[10px] text-slate-500">{note}</p></div>;
}

function ReportPriority({ title, detail, urgent }: { title: string; detail: string; urgent: boolean }) {
  return <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"><span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${urgent ? "bg-[#c77255]/20 text-[#f1b19a]" : "bg-emerald-400/15 text-emerald-300"}`}>{urgent ? <Clock3 size={13} /> : <CheckCircle2 size={13} />}</span><div className="min-w-0"><p className="text-xs font-semibold text-white">{title}</p><p className="mt-1 truncate text-[11px] text-slate-400">{detail}</p></div></div>;
}

function OperationalSignal({ label, value, note, icon }: { label: string; value: number; note: string; icon: ReactNode }) {
  return <div className="flex items-center gap-4 rounded-2xl border border-[#d8d0c4] bg-white/65 p-4"><span className="grid size-11 place-items-center rounded-2xl bg-[#deebe5] text-[#176b52]">{icon}</span><div><p className="text-2xl font-semibold text-[#211f1c]">{value}</p><p className="text-xs font-semibold text-[#514c45]">{label}</p><p className="mt-1 text-[10px] text-[#8a8176]">{note}</p></div></div>;
}
