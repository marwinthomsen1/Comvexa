"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, FilePlus2, ReceiptText, Trash2 } from "lucide-react";
import { formatCurrencyAmount } from "@/app/_components/currency-display";
import { supabase } from "@/src/lib/supabase/client";
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

const lanes = [
  { key: "unpaid", title: "Unpaid", icon: AlertCircle },
  { key: "pending", title: "Pending", icon: ReceiptText },
  { key: "paid", title: "Paid", icon: CheckCircle2 },
];

const laneStyles: Record<string, { accent: string; badge: string }> = {
  unpaid: { accent: "bg-amber-400", badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  pending: { accent: "bg-blue-400", badge: "bg-blue-50 text-blue-700 ring-blue-200" },
  paid: { accent: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
};

function formatInvoiceDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}

export default function InvoicesPage() {
  return (
    <PlanGate moduleName="Invoices">
      <InvoicePipeline />
    </PlanGate>
  );
}

function InvoicePipeline() {
  const [companyId, setCompanyId] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [pendingInvoiceIds, setPendingInvoiceIds] = useState<Set<string>>(() => new Set());

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
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();

    if (!profile?.company_id) {
      setError("Your profile is not connected to a company yet.");
      return;
    }

    setCompanyId(profile.company_id);
    const { data, error: invoicesError } = await supabase
      .from("invoices")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("due_date", { ascending: true });

    if (invoicesError) {
      setError(invoicesError.message);
      return;
    }

    setInvoices((data ?? []) as Invoice[]);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadInvoices(), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const totals = useMemo(() => {
    const sum = (rows: Invoice[]) => rows.reduce((total, invoice) => total + Number(invoice.total_amount ?? 0), 0);
    return {
      total: sum(invoices),
      unpaid: sum(invoices.filter((invoice) => invoice.payment_status !== "paid")),
      paid: sum(invoices.filter((invoice) => invoice.payment_status === "paid")),
    };
  }, [invoices]);

  async function addInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!companyId) {
      setError("Your company workspace is not ready yet.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const { error: insertError } = await supabase.from("invoices").insert({
      company_id: companyId,
      invoice_number: String(formData.get("invoice_number") ?? "").trim(),
      total_amount: Number(formData.get("total_amount") ?? 0),
      payment_status: String(formData.get("payment_status") ?? "unpaid"),
      due_date: String(formData.get("due_date") ?? "") || null,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    form.reset();
    await loadInvoices();
  }

  async function updateStatus(invoice: Invoice, status: string) {
    if (pendingInvoiceIds.has(invoice.id)) {
      return;
    }

    const previousStatus = invoice.payment_status;
    setError("");
    setPendingInvoiceIds((current) => new Set(current).add(invoice.id));
    setInvoices((current) =>
      current.map((item) => item.id === invoice.id ? { ...item, payment_status: status } : item),
    );

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    let updateError = "";

    try {
      const { error } = await supabase
        .from("invoices")
        .update({ payment_status: status })
        .eq("id", invoice.id)
        .abortSignal(controller.signal);
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
      setInvoices((current) =>
        current.map((item) => item.id === invoice.id ? { ...item, payment_status: previousStatus } : item),
      );
      setError(controller.signal.aborted ? "The invoice update timed out. Please try again." : updateError);
    }
  }

  async function deleteInvoice(id: string) {
    const { error: deleteError } = await supabase.from("invoices").delete().eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadInvoices();
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Billing pipeline</p>
        <div className="mt-3 grid gap-5 xl:grid-cols-[1fr_420px]">
          <div>
            <h2 className="text-3xl font-semibold tracking-normal text-slate-950">Invoices</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Track invoice money by payment stage and move invoices through the billing workflow.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Total" value={formatCurrencyAmount(totals.total, currency)} />
            <Metric label="Unpaid" value={formatCurrencyAmount(totals.unpaid, currency)} />
            <Metric label="Paid" value={formatCurrencyAmount(totals.paid, currency)} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={addInvoice} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <h3 className="font-semibold text-slate-950">Create invoice</h3>
          <div className="mt-5 grid gap-4">
            <input name="invoice_number" required placeholder="Invoice number" className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
            <input name="total_amount" type="number" required placeholder="Amount" className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
            <input name="due_date" type="date" className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
            <select name="payment_status" defaultValue="unpaid" className="h-11 rounded-xl border border-slate-300 px-3 text-sm capitalize outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100">
              <option value="unpaid">unpaid</option>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
            </select>
            {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">{error}</p> : null}
            <button disabled={!companyId} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300">
              <FilePlus2 size={17} />
              Create invoice
            </button>
          </div>
        </form>

        <div className="grid gap-4 lg:grid-cols-3">
          {lanes.map((lane) => {
            const Icon = lane.icon;
            const laneInvoices = invoices.filter((invoice) => (invoice.payment_status ?? "unpaid") === lane.key);

            return (
              <section key={lane.key} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-950"><Icon size={18} />{lane.title}</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{laneInvoices.length}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {laneInvoices.map((invoice) => (
                    <article key={invoice.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                      <span className={`absolute inset-x-0 top-0 h-1 ${laneStyles[lane.key].accent}`} />
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${laneStyles[lane.key].badge}`}>
                          <span className={`size-1.5 rounded-full ${laneStyles[lane.key].accent}`} />
                          {pendingInvoiceIds.has(invoice.id) ? "Syncing" : lane.title}
                        </span>
                        <button type="button" onClick={() => void deleteInvoice(invoice.id)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600" aria-label="Delete invoice"><Trash2 size={15} /></button>
                      </div>
                      <p className="mt-4 truncate text-sm font-semibold text-slate-600">{invoice.invoice_number}</p>
                      <p className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{formatCurrencyAmount(Number(invoice.total_amount ?? 0), currency)}</p>
                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                        <CalendarDays size={15} className="text-slate-400" />
                        <span>{invoice.due_date ? `Due ${formatInvoiceDate(invoice.due_date)}` : "No due date"}</span>
                      </div>
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Move to</p>
                        <div className="flex flex-wrap gap-2">
                        {lanes.filter((item) => item.key !== lane.key).map((next) => (
                          (() => {
                            const NextIcon = next.icon;
                            const isPrimary = next.key === "paid";
                            return (
                              <button
                                key={next.key}
                                type="button"
                                disabled={pendingInvoiceIds.has(invoice.id)}
                                onClick={() => void updateStatus(invoice, next.key)}
                                className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-50 ${isPrimary ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                              >
                                <NextIcon size={14} />
                                {next.title}
                              </button>
                            );
                          })()
                        ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950 xl:text-base">{value}</p>
    </div>
  );
}
