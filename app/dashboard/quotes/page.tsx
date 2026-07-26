"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, FileCheck2, Plus, Search, Trash2, X } from "lucide-react";
import { formatCurrencyAmount } from "@/app/_components/currency-display";
import { supabase } from "@/src/lib/supabase/client";
import { getWorkspaceCompanyId } from "@/src/lib/supabase/workspace";
import { PlanGate } from "../_components/plan-gate";

type Customer = { id: string; name: string | null; email: string | null };
type Quote = {
  id: string;
  company_id: string;
  customer_id: string | null;
  quote_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  total_amount: number | null;
  status: string | null;
  valid_until: string | null;
  notes: string | null;
  converted_invoice_id: string | null;
  decision_status: string | null;
  decided_at: string | null;
  signer_name: string | null;
  signature_text: string | null;
  revision_number: number | null;
  created_at: string | null;
};

export default function QuotesPage() {
  return <PlanGate moduleName="Quotes"><QuoteWorkspace /></PlanGate>;
}

function QuoteWorkspace() {
  const [companyId, setCompanyId] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const saved = window.localStorage.getItem("comvexa-workspace-settings");
        setCurrency(saved ? JSON.parse(saved).currency ?? "USD" : "USD");
      } catch {
        setCurrency("USD");
      }
      const { data: session } = await supabase.auth.getSession();
      const user = session.session?.user;
      if (!user) {
        setError("You must be logged in to view quotes.");
        setIsLoading(false);
        return;
      }
      const workspaceCompanyId = await getWorkspaceCompanyId(user.id);
      if (!workspaceCompanyId) {
        setError("Your profile is not connected to a company yet.");
        setIsLoading(false);
        return;
      }
      setCompanyId(workspaceCompanyId);
      const [quotesResult, customersResult] = await Promise.all([
        supabase.from("quotes").select("*").eq("company_id", workspaceCompanyId).order("created_at", { ascending: false }),
        supabase.from("customers").select("id, name, email").eq("company_id", workspaceCompanyId).order("name"),
      ]);
      if (quotesResult.error) setError(quotesResult.error.message);
      setQuotes((quotesResult.data ?? []) as Quote[]);
      setCustomers((customersResult.data ?? []) as Customer[]);
      setIsLoading(false);
    }
    void load();
  }, []);

  const filteredQuotes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return quotes.filter((quote) => !term || [quote.quote_number, quote.customer_name, quote.status, quote.total_amount].some((value) => String(value ?? "").toLowerCase().includes(term)));
  }, [quotes, search]);
  const openValue = quotes.filter((quote) => !["converted", "declined"].includes(String(quote.status))).reduce((sum, quote) => sum + Number(quote.total_amount ?? 0), 0);
  const accepted = quotes.filter((quote) => quote.status === "accepted" || quote.status === "converted").length;

  async function addQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const customer = customers.find((item) => item.id === data.get("customer_id"));
    const quote: Quote = {
      id: crypto.randomUUID(),
      company_id: companyId,
      customer_id: customer?.id ?? null,
      quote_number: String(data.get("quote_number") ?? "").trim(),
      customer_name: customer?.name ?? String(data.get("customer_name") ?? "").trim(),
      customer_email: customer?.email ?? String(data.get("customer_email") ?? "").trim(),
      total_amount: Number(data.get("total_amount") ?? 0),
      status: "draft",
      valid_until: String(data.get("valid_until") ?? "") || null,
      notes: String(data.get("notes") ?? "").trim() || null,
      converted_invoice_id: null,
      decision_status: "pending",
      decided_at: null,
      signer_name: null,
      signature_text: null,
      revision_number: 1,
      created_at: new Date().toISOString(),
    };
    setQuotes((current) => [quote, ...current]);
    setShowForm(false);
    form.reset();
    const { error: insertError } = await supabase.from("quotes").insert(quote);
    if (insertError) {
      setQuotes((current) => current.filter((item) => item.id !== quote.id));
      setError(insertError.message);
    }
  }

  async function updateStatus(quote: Quote, status: string) {
    const previous = quote.status;
    setQuotes((current) => current.map((item) => item.id === quote.id ? { ...item, status } : item));
    const { error: updateError } = await supabase.from("quotes").update({ status }).eq("id", quote.id);
    if (updateError) {
      setQuotes((current) => current.map((item) => item.id === quote.id ? { ...item, status: previous } : item));
      setError(updateError.message);
    }
  }

  async function convertToInvoice(quote: Quote) {
    if (quote.converted_invoice_id || pendingId) return;
    setPendingId(quote.id);
    setError("");
    const invoiceId = crypto.randomUUID();
    const invoiceNumber = `INV-${String(Date.now()).slice(-6)}`;
    const due = new Date();
    due.setDate(due.getDate() + 14);
    const { error: invoiceError } = await supabase.from("invoices").insert({
      id: invoiceId,
      company_id: quote.company_id,
      customer_id: quote.customer_id,
      customer_name: quote.customer_name,
      customer_email: quote.customer_email,
      invoice_number: invoiceNumber,
      total_amount: quote.total_amount,
      payment_status: "unpaid",
      due_date: due.toISOString().slice(0, 10),
      notes: quote.notes,
    });
    if (invoiceError) {
      setError(invoiceError.message);
      setPendingId("");
      return;
    }
    const { error: quoteError } = await supabase.from("quotes").update({ status: "converted", converted_invoice_id: invoiceId }).eq("id", quote.id);
    if (quoteError) {
      setError(`Invoice created, but the quote could not be marked converted: ${quoteError.message}`);
    } else {
      setQuotes((current) => current.map((item) => item.id === quote.id ? { ...item, status: "converted", converted_invoice_id: invoiceId } : item));
    }
    setPendingId("");
  }

  async function recordDecision(quote: Quote, decision: "accepted" | "declined") {
    const signer = decision === "accepted" ? window.prompt("Customer or signer name")?.trim() : "";
    if (decision === "accepted" && !signer) return;
    const updates = { decision_status: decision, decided_at: new Date().toISOString(), signer_name: signer || null, signature_text: signer ? `Digitally accepted by ${signer}` : null, status: decision };
    const { error: decisionError } = await supabase.from("quotes").update(updates).eq("id", quote.id);
    if (decisionError) {
      setError(decisionError.message);
      return;
    }
    setQuotes((current) => current.map((item) => item.id === quote.id ? { ...item, ...updates } : item));
  }

  async function createRevision(quote: Quote) {
    const revision = Number(quote.revision_number ?? 1) + 1;
    const { error: revisionError } = await supabase.from("quotes").update({ revision_number: revision, decision_status: "pending", decided_at: null, signer_name: null, signature_text: null, status: "draft" }).eq("id", quote.id);
    if (revisionError) setError(revisionError.message);
    else setQuotes((current) => current.map((item) => item.id === quote.id ? { ...item, revision_number: revision, decision_status: "pending", decided_at: null, signer_name: null, signature_text: null, status: "draft" } : item));
  }

  async function deleteQuote(quote: Quote) {
    const previous = quotes;
    setQuotes((current) => current.filter((item) => item.id !== quote.id));
    const { error: deleteError } = await supabase.from("quotes").delete().eq("id", quote.id);
    if (deleteError) {
      setQuotes(previous);
      setError(deleteError.message);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="rounded-[2rem] border border-emerald-200 bg-[#f1fbf6] p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Sales desk</p><h2 className="mt-2 text-3xl font-semibold text-slate-950">Quotes & estimates</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Prepare a price, track the customer decision, then turn accepted work into an invoice without typing it twice.</p></div>
          <div className="grid grid-cols-3 gap-2"><Metric label="Quotes" value={String(quotes.length)} /><Metric label="Open value" value={formatCurrencyAmount(openValue, currency)} /><Metric label="Won" value={String(accepted)} /></div>
        </div>
      </section>

      <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex h-11 w-full max-w-sm items-center gap-3 rounded-xl border border-slate-300 px-3 text-sm text-slate-500 focus-within:ring-4 focus-within:ring-emerald-100"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search quotes or customers" className="min-w-0 flex-1 outline-none" /></label>
          <button type="button" onClick={() => setShowForm(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"><Plus size={16} />New quote</button>
        </div>
        {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-[1fr_1fr_130px_130px_160px_44px] gap-4 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:grid"><span>Quote</span><span>Customer</span><span>Value</span><span>Valid until</span><span>Status</span><span /></div>
          <div className="divide-y divide-slate-100">{isLoading ? <p className="p-8 text-center text-sm text-slate-500">Loading quotes…</p> : filteredQuotes.length ? filteredQuotes.map((quote) => (
            <article key={quote.id} className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_130px_130px_160px_44px] md:items-center md:gap-4">
              <div><p className="text-sm font-semibold text-slate-950">{quote.quote_number || "Untitled quote"} <span className="text-[10px] text-slate-400">v{quote.revision_number ?? 1}</span></p><p className="mt-1 truncate text-xs text-slate-400">{quote.signer_name ? `Signed by ${quote.signer_name}` : quote.notes || "No notes"}</p><div className="mt-2 flex gap-1"><button type="button" onClick={() => void recordDecision(quote, "accepted")} className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Accept & sign</button><button type="button" onClick={() => void recordDecision(quote, "declined")} className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700">Decline</button><button type="button" onClick={() => void createRevision(quote)} className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">New revision</button></div></div>
              <div><p className="truncate text-sm font-medium text-slate-700">{quote.customer_name || "Walk-in customer"}</p><p className="mt-1 truncate text-xs text-slate-400">{quote.customer_email || "No email"}</p></div>
              <p className="font-semibold text-slate-950">{formatCurrencyAmount(Number(quote.total_amount ?? 0), currency)}</p>
              <p className="text-xs text-slate-500">{quote.valid_until || "No expiry"}</p>
              {quote.status === "converted" ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 size={14} />Converted</span> : <div className="flex gap-2"><select value={quote.status ?? "draft"} onChange={(event) => void updateStatus(quote, event.target.value)} className="h-9 min-w-0 rounded-lg border border-slate-200 px-2 text-xs"><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select><button type="button" onClick={() => void convertToInvoice(quote)} disabled={pendingId === quote.id} className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50" title="Convert to invoice" aria-label={`Convert ${quote.quote_number} to invoice`}><ArrowRight size={15} /></button></div>}
              <button type="button" onClick={() => void deleteQuote(quote)} className="grid size-9 place-items-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${quote.quote_number}`}><Trash2 size={15} /></button>
            </article>
          )) : <div className="grid min-h-64 place-items-center p-8 text-center"><div><FileCheck2 className="mx-auto text-slate-300" size={38} /><p className="mt-3 font-semibold text-slate-800">No quotes yet</p><p className="mt-1 text-sm text-slate-500">Create your first estimate and convert it when the customer accepts.</p></div></div>}</div>
        </div>
      </section>

      {showForm ? <div className="fixed inset-0 z-50 grid place-items-center p-4"><button type="button" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowForm(false)} aria-label="Close quote form" /><form onSubmit={addQuote} className="relative w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">New estimate</p><h3 className="mt-2 text-2xl font-semibold text-slate-950">Create quote</h3></div><button type="button" onClick={() => setShowForm(false)} className="grid size-10 place-items-center rounded-xl border border-slate-200"><X size={17} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Quote number"><input name="quote_number" required autoFocus placeholder="Q-001" className={inputClass} /></Field><Field label="Customer"><select name="customer_id" className={inputClass}><option value="">Enter manually</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name || customer.email}</option>)}</select></Field><Field label="Customer name"><input name="customer_name" placeholder="Optional when selected above" className={inputClass} /></Field><Field label="Customer email"><input name="customer_email" type="email" className={inputClass} /></Field><Field label="Total"><input name="total_amount" type="number" min="0" step="any" required className={inputClass} /></Field><Field label="Valid until"><input name="valid_until" type="date" className={inputClass} /></Field><label className="sm:col-span-2"><span className="text-sm font-medium text-slate-700">Notes or scope</span><textarea name="notes" rows={4} className={`${inputClass} h-auto py-3`} /></label><button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white sm:col-span-2"><Plus size={16} />Create quote</button></div></form></div> : null}
    </main>
  );
}

const inputClass = "mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="min-w-24 rounded-2xl border border-emerald-200 bg-white/70 p-3"><p className="text-[9px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-950">{value}</p></div>; }
