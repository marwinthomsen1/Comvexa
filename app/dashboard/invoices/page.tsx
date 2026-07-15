"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  FilePlus2,
  Filter,
  Landmark,
  ReceiptText,
  Search,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { formatCurrencyAmount } from "@/app/_components/currency-display";
import { supabase } from "@/src/lib/supabase/client";
import { getWorkspaceCompanyId } from "@/src/lib/supabase/workspace";
import { PlanGate } from "../_components/plan-gate";

type Invoice = {
  id: string;
  company_id: string;
  invoice_number: string | null;
  total_amount: number | null;
  payment_status: string | null;
  due_date: string | null;
  created_at: string | null;
};

const invoiceCache = new Map<string, Invoice[]>();
const pageSize = 20;

export default function InvoicesPage() {
  return (
    <PlanGate moduleName="Invoices">
      <ReceivablesLedger />
    </PlanGate>
  );
}

function ReceivablesLedger() {
  const [companyId, setCompanyId] = useState("");
  const [cacheKey, setCacheKey] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showComposer, setShowComposer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingInvoiceIds, setPendingInvoiceIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    async function loadInvoices() {
      try {
        const saved = window.localStorage.getItem("comvexa-workspace-settings");
        setCurrency(saved ? JSON.parse(saved).currency ?? "USD" : "USD");
      } catch {
        setCurrency("USD");
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setError("You must be logged in to view invoices.");
        setIsLoading(false);
        return;
      }

      const nextCacheKey = `${user.id}:invoices`;
      setCacheKey(nextCacheKey);
      const cached = invoiceCache.get(nextCacheKey);
      if (cached) {
        setInvoices(cached);
        setIsLoading(false);
      }

      const workspaceCompanyId = await getWorkspaceCompanyId(user.id);
      if (!workspaceCompanyId) {
        setError("Your profile is not connected to a company yet.");
        setIsLoading(false);
        return;
      }

      setCompanyId(workspaceCompanyId);
      const { data, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("company_id", workspaceCompanyId)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (invoicesError) {
        setError(invoicesError.message);
        setIsLoading(false);
        return;
      }

      const nextInvoices = (data ?? []) as Invoice[];
      invoiceCache.set(nextCacheKey, nextInvoices);
      setInvoices(nextInvoices);
      setIsLoading(false);
    }

    const timeout = window.setTimeout(() => void loadInvoices(), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!showComposer) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowComposer(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showComposer]);

  const today = getTodayKey();
  const totals = useMemo(() => calculateInvoiceTotals(invoices, today), [invoices, today]);
  const collectionRate = totals.total ? Math.round((totals.paid / totals.total) * 100) : 0;

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const status = normalizeInvoiceStatus(invoice.payment_status);
      const age = getInvoiceAge(invoice, today).key;
      const matchesSearch = !term || [invoice.invoice_number, invoice.total_amount, invoice.due_date, status].some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesAge = ageFilter === "all" || age === ageFilter;
      return matchesSearch && matchesStatus && matchesAge;
    });
  }, [ageFilter, invoices, search, statusFilter, today]);

  const pageCount = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function persistLocal(nextInvoices: Invoice[]) {
    setInvoices(nextInvoices);
    if (cacheKey) invoiceCache.set(cacheKey, nextInvoices);
  }

  async function addInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId) {
      setError("Your company workspace is not ready yet.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const invoice: Invoice = {
      id: crypto.randomUUID(),
      company_id: companyId,
      invoice_number: String(formData.get("invoice_number") ?? "").trim(),
      total_amount: Number(formData.get("total_amount") ?? 0),
      payment_status: String(formData.get("payment_status") ?? "unpaid"),
      due_date: String(formData.get("due_date") ?? "") || null,
      created_at: new Date().toISOString(),
    };

    const previous = invoices;
    setError("");
    persistLocal([invoice, ...invoices]);
    setPage(1);
    setSearch("");
    form.reset();
    setShowComposer(false);
    const { error: insertError } = await supabase.from("invoices").insert(invoice);
    if (insertError) {
      persistLocal(previous);
      setError(insertError.message);
    }
  }

  async function updateStatus(invoice: Invoice, status: string) {
    if (pendingInvoiceIds.has(invoice.id)) return;
    const previous = invoices;
    setError("");
    setPendingInvoiceIds((current) => new Set(current).add(invoice.id));
    persistLocal(invoices.map((item) => item.id === invoice.id ? { ...item, payment_status: status } : item));

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    let updateError = "";
    try {
      const { error } = await supabase.from("invoices").update({ payment_status: status }).eq("id", invoice.id).abortSignal(controller.signal);
      updateError = error?.message ?? "";
    } catch (caughtError) {
      updateError = caughtError instanceof Error ? caughtError.message : "Could not update the invoice.";
    } finally {
      window.clearTimeout(timeout);
      setPendingInvoiceIds((current) => {
        const next = new Set(current);
        next.delete(invoice.id);
        return next;
      });
    }

    if (updateError) {
      persistLocal(previous);
      setError(controller.signal.aborted ? "The invoice update timed out. Please try again." : updateError);
    }
  }

  async function deleteInvoice(invoice: Invoice) {
    const previous = invoices;
    persistLocal(invoices.filter((item) => item.id !== invoice.id));
    const { error: deleteError } = await supabase.from("invoices").delete().eq("id", invoice.id);
    if (deleteError) {
      persistLocal(previous);
      setError(deleteError.message);
    }
  }

  function exportInvoices() {
    const header = ["Invoice", "Amount", "Status", "Due date", "Created"];
    const csv = [
      header.map(csvEscape).join(","),
      ...filteredInvoices.map((invoice) => [invoice.invoice_number, invoice.total_amount, invoice.payment_status, invoice.due_date, invoice.created_at].map((value) => csvEscape(String(value ?? ""))).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "invoices.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="invoice-ledger-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="dashboard-custom-hero invoice-ledger-hero overflow-hidden rounded-[2rem] border border-[#ead9b8] bg-[#fff8e8] p-6 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr] xl:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b15f24]">Receivables ledger</p>
            <p className="mt-5 text-sm font-medium text-slate-500">Outstanding balance</p>
            <h2 className="mt-1 text-4xl font-semibold tracking-[-0.05em] text-[#1e293b] sm:text-5xl">{formatCurrencyAmount(totals.outstanding, currency, false, 2)}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">A finance-first view of what is due, what is aging, and what has already been collected.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <LedgerMetric label="Total billed" value={formatCurrencyAmount(totals.total, currency, false, 2)} icon={ReceiptText} />
            <LedgerMetric label="Collected" value={formatCurrencyAmount(totals.paid, currency, false, 2)} icon={Landmark} />
            <LedgerMetric label="Collection rate" value={`${collectionRate}%`} icon={TrendingUp} />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="invoice-ledger-panel rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-500 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-100 xl:max-w-sm">
              <Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search invoice number" className="min-w-0 flex-1 bg-transparent outline-none" />
            </label>
            <div className="flex flex-wrap gap-2">
              <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500"><Filter size={14} /><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="bg-transparent text-sm font-medium text-slate-700 outline-none"><option value="all">All statuses</option><option value="unpaid">Unpaid</option><option value="pending">Pending</option><option value="paid">Paid</option></select></label>
              <select value={ageFilter} onChange={(event) => { setAgeFilter(event.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none"><option value="all">All ages</option><option value="current">Current</option><option value="1-30">1–30 days late</option><option value="31+">31+ days late</option><option value="no-date">No due date</option></select>
              <button type="button" onClick={exportInvoices} disabled={!filteredInvoices.length} className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40" aria-label="Export invoices"><Download size={16} /></button>
              <button type="button" onClick={() => setShowComposer(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#c7642b] px-4 text-sm font-semibold text-white hover:bg-[#ad5321]"><FilePlus2 size={16} />New invoice</button>
            </div>
          </div>

          {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100" role="alert">{error}</p> : null}

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="hidden grid-cols-[minmax(140px,1fr)_120px_130px_120px_150px_48px] gap-4 bg-slate-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:grid"><span>Invoice</span><span>Amount</span><span>Due</span><span>Aging</span><span>Payment</span><span /></div>
            <div className="divide-y divide-slate-100">
              {isLoading ? Array.from({ length: 6 }, (_, index) => <div key={index} className="h-20 animate-pulse bg-white p-4"><div className="h-full rounded-xl bg-slate-100" /></div>) : visibleInvoices.length ? visibleInvoices.map((invoice) => (
                <InvoiceLedgerRow key={invoice.id} invoice={invoice} currency={currency} today={today} pending={pendingInvoiceIds.has(invoice.id)} onStatusChange={updateStatus} onDelete={deleteInvoice} />
              )) : <div className="grid min-h-72 place-items-center p-8 text-center"><div><ReceiptText className="mx-auto text-slate-300" size={38} /><p className="mt-3 font-semibold text-slate-800">No invoices found</p><p className="mt-1 text-sm text-slate-500">Adjust the filters or create an invoice.</p></div></div>}
            </div>
          </div>

          {!isLoading && filteredInvoices.length ? (
            <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-slate-500">Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredInvoices.length)}</span> of <span className="font-semibold text-slate-700">{filteredInvoices.length}</span></p><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 disabled:opacity-40">Previous</button><span className="min-w-14 text-center text-xs text-slate-500">{currentPage} / {pageCount}</span><button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 disabled:opacity-40">Next</button></div></div>
          ) : null}
        </div>

        <aside className="invoice-aging-panel self-start rounded-[2rem] border border-[#273444] bg-[#17202c] p-5 text-white shadow-lg xl:sticky xl:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f6b77b]">Aging summary</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Where money is waiting</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">Outstanding invoices grouped by how long they have been due.</p>
          <div className="mt-6 space-y-5">
            <AgingBar label="Current" amount={totals.current} total={totals.outstanding} currency={currency} color="bg-sky-400" />
            <AgingBar label="1–30 days late" amount={totals.oneToThirty} total={totals.outstanding} currency={currency} color="bg-amber-400" />
            <AgingBar label="31+ days late" amount={totals.thirtyOnePlus} total={totals.outstanding} currency={currency} color="bg-red-400" />
            <AgingBar label="No due date" amount={totals.noDate} total={totals.outstanding} currency={currency} color="bg-slate-500" />
          </div>
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.05] p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-300">Paid invoices</span><CheckCircle2 size={17} className="text-emerald-300" /></div><p className="mt-2 text-2xl font-semibold text-white">{formatCurrencyAmount(totals.paid, currency, false, 2)}</p></div>
        </aside>
      </section>

      {showComposer ? (
        <div className="invoice-composer-overlay fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="invoice-composer-title">
          <button type="button" onClick={() => setShowComposer(false)} className="absolute inset-0 bg-[#17202c]/60 backdrop-blur-sm" aria-label="Close invoice composer" />
          <form onSubmit={addInvoice} className="invoice-composer relative w-full max-w-xl rounded-[2rem] border border-[#ead9b8] bg-[#fffdf8] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b15f24]">New receivable</p><h3 id="invoice-composer-title" className="mt-2 text-2xl font-semibold text-slate-950">Create invoice</h3></div><button type="button" onClick={() => setShowComposer(false)} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-white" aria-label="Close invoice composer"><X size={18} /></button></div>
            <div className="mt-6 grid gap-4">
              <label><span className="text-sm font-medium text-slate-700">Invoice number</span><input name="invoice_number" required autoFocus placeholder="INV-001" className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" /></label>
              <div className="grid gap-4 sm:grid-cols-2"><label><span className="text-sm font-medium text-slate-700">Amount</span><input name="total_amount" type="number" step="any" min="0" required placeholder="0.00" className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" /></label><label><span className="text-sm font-medium text-slate-700">Due date</span><input name="due_date" type="date" className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" /></label></div>
              <label><span className="text-sm font-medium text-slate-700">Payment status</span><select name="payment_status" defaultValue="unpaid" className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"><option value="unpaid">Unpaid</option><option value="pending">Pending</option><option value="paid">Paid</option></select></label>
              <button disabled={!companyId} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#c7642b] px-4 text-sm font-semibold text-white hover:bg-[#ad5321] disabled:opacity-50"><FilePlus2 size={17} />Create invoice</button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function InvoiceLedgerRow({ invoice, currency, today, pending, onStatusChange, onDelete }: { invoice: Invoice; currency: string; today: string; pending: boolean; onStatusChange: (invoice: Invoice, status: string) => void; onDelete: (invoice: Invoice) => void }) {
  const status = normalizeInvoiceStatus(invoice.payment_status);
  const age = getInvoiceAge(invoice, today);
  return (
    <article className={`invoice-ledger-row grid gap-3 bg-white p-4 md:grid-cols-[minmax(140px,1fr)_120px_130px_120px_150px_48px] md:items-center md:gap-4 ${age.key === "31+" ? "border-l-4 border-l-red-400" : age.key === "1-30" ? "border-l-4 border-l-amber-400" : ""}`}>
      <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{invoice.invoice_number || "Untitled invoice"}</p><p className="mt-1 text-xs text-slate-400">Created {formatShortDate(invoice.created_at)}</p></div>
      <p className="text-base font-semibold text-slate-950">{formatCurrencyAmount(Number(invoice.total_amount ?? 0), currency, false, 2)}</p>
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600"><CalendarDays size={13} className="text-slate-400" />{invoice.due_date ? formatShortDate(invoice.due_date) : "No date"}</span>
      <span className={`w-fit rounded-lg px-2.5 py-1.5 text-xs font-semibold ${age.className}`}>{age.label}</span>
      <select value={status} disabled={pending} onChange={(event) => onStatusChange(invoice, event.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 outline-none disabled:cursor-wait disabled:opacity-50" aria-label={`Payment status for ${invoice.invoice_number}`}><option value="unpaid">Unpaid</option><option value="pending">Pending</option><option value="paid">Paid</option></select>
      <button type="button" onClick={() => onDelete(invoice)} className="grid size-9 place-items-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${invoice.invoice_number}`}><Trash2 size={15} /></button>
    </article>
  );
}

function LedgerMetric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof ReceiptText }) {
  return <div className="rounded-2xl border border-[#ead9b8] bg-white/70 p-4"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p><Icon size={15} className="text-[#b15f24]" /></div><p className="mt-2 truncate text-lg font-semibold text-slate-950">{value}</p></div>;
}

function AgingBar({ label, amount, total, currency, color }: { label: string; amount: number; total: number; currency: string; color: string }) {
  const width = total ? Math.max(amount ? 5 : 0, Math.round((amount / total) * 100)) : 0;
  return <div><div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-300">{label}</span><span className="font-semibold text-white">{formatCurrencyAmount(amount, currency, false, 2)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} /></div></div>;
}

function normalizeInvoiceStatus(status: string | null) {
  const value = String(status ?? "unpaid").toLowerCase();
  return value === "paid" || value === "pending" ? value : "unpaid";
}

function calculateInvoiceTotals(invoices: Invoice[], today: string) {
  const totals = { total: 0, paid: 0, outstanding: 0, current: 0, oneToThirty: 0, thirtyOnePlus: 0, noDate: 0 };
  invoices.forEach((invoice) => {
    const amount = Number(invoice.total_amount ?? 0);
    totals.total += amount;
    if (normalizeInvoiceStatus(invoice.payment_status) === "paid") {
      totals.paid += amount;
      return;
    }
    totals.outstanding += amount;
    const age = getInvoiceAge(invoice, today).key;
    if (age === "1-30") totals.oneToThirty += amount;
    else if (age === "31+") totals.thirtyOnePlus += amount;
    else if (age === "no-date") totals.noDate += amount;
    else totals.current += amount;
  });
  return totals;
}

function getInvoiceAge(invoice: Invoice, today: string) {
  if (normalizeInvoiceStatus(invoice.payment_status) === "paid") return { key: "paid", label: "Paid", className: "bg-emerald-50 text-emerald-700" };
  if (!invoice.due_date) return { key: "no-date", label: "No due date", className: "bg-slate-100 text-slate-600" };
  if (invoice.due_date >= today) return { key: "current", label: "Current", className: "bg-sky-50 text-sky-700" };
  const days = Math.max(1, Math.floor((new Date(`${today}T00:00:00`).getTime() - new Date(`${invoice.due_date}T00:00:00`).getTime()) / 86_400_000));
  return days <= 30 ? { key: "1-30", label: `${days}d late`, className: "bg-amber-50 text-amber-700" } : { key: "31+", label: `${days}d late`, className: "bg-red-50 text-red-700" };
}

function getTodayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatShortDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "2-digit" }).format(date);
}

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
