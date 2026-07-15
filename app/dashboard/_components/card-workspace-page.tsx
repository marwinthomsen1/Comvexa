"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Download, Plus, Search, Trash2 } from "lucide-react";
import { formatCurrencyAmount } from "@/app/_components/currency-display";
import { supabase } from "@/src/lib/supabase/client";
import { getWorkspaceCompanyId } from "@/src/lib/supabase/workspace";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "time" | "textarea" | "select";
  required?: boolean;
  options?: string[];
};

type CardWorkspacePageProps = {
  table: string;
  title: string;
  eyebrow: string;
  description: string;
  actionLabel: string;
  fields: Field[];
  titleKey: string;
  metaKeys?: string[];
  moneyKey?: string;
  statusKey?: string;
  dateKey?: string;
  variant?: "cards" | "ledger" | "directory" | "compact";
};

type Row = Record<string, string | number | null>;

const rowsCache = new Map<string, Row[]>();

const defaultSettings = { currency: "USD" };

function readCurrency() {
  try {
    const saved = window.localStorage.getItem("comvexa-workspace-settings");
    return saved ? { ...defaultSettings, ...JSON.parse(saved) }.currency : "USD";
  } catch {
    return "USD";
  }
}

function csvEscape(value: string | number | null) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function CardWorkspacePage({
  table,
  title,
  eyebrow,
  description,
  actionLabel,
  fields,
  titleKey,
  metaKeys = [],
  moneyKey,
  statusKey,
  dateKey,
  variant = "cards",
}: CardWorkspacePageProps) {
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cacheKey, setCacheKey] = useState("");

  const loadRows = useCallback(async function loadRows() {
    setCurrency(readCurrency());
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setError("You must be logged in to view this page.");
      setIsLoading(false);
      return;
    }

    const nextCacheKey = `${user.id}:${table}`;
    const cachedRows = rowsCache.get(nextCacheKey);
    setCacheKey(nextCacheKey);

    if (cachedRows) {
      setRows(cachedRows);
      setIsLoading(false);
    }

    const workspaceCompanyId = await getWorkspaceCompanyId(user.id);

    if (!workspaceCompanyId) {
      setError("Your profile is not connected to a company yet.");
      setIsLoading(false);
      return;
    }

    setCompanyId(workspaceCompanyId);
    const selectedColumns = Array.from(new Set(["id", "company_id", "created_at", ...fields.map((field) => field.name)])).join(",");
    const { data, error: rowsError } = await supabase
      .from(table)
      .select(selectedColumns)
      .eq("company_id", workspaceCompanyId)
      .order("created_at", { ascending: false });

    if (rowsError) {
      setError(rowsError.message);
      setIsLoading(false);
      return;
    }

    const nextRows = (data ?? []) as unknown as Row[];
    rowsCache.set(nextCacheKey, nextRows);
    setRows(nextRows);
    setIsLoading(false);
  }, [fields, table]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadRows(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(term)));
  }, [rows, search]);

  const totalMoney = moneyKey
    ? rows.reduce((sum, row) => sum + Number(row[moneyKey] ?? 0), 0)
    : rows.length;
  const activeCount = statusKey
    ? rows.filter((row) => String(row[statusKey] ?? "").toLowerCase() === "active" || String(row[statusKey] ?? "").toLowerCase() === "paid").length
    : filteredRows.length;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!companyId) {
      setError("Your company workspace is not ready yet.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload: Row = { company_id: companyId };
    fields.forEach((field) => {
      const rawValue = String(formData.get(field.name) ?? "").trim();
      payload[field.name] = field.type === "number" ? Number(rawValue || 0) : rawValue || null;
    });

    const optimisticRow: Row = {
      id: crypto.randomUUID(),
      ...payload,
    };

    setRows((currentRows) => {
      const nextRows = [optimisticRow, ...currentRows];
      if (cacheKey) rowsCache.set(cacheKey, nextRows);
      return nextRows;
    });
    form.reset();
    setIsSaving(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    let saveError = "";

    try {
      const { error } = await supabase.from(table).insert(optimisticRow).abortSignal(controller.signal);
      saveError = error?.message ?? "";
    } catch (caughtError) {
      saveError = caughtError instanceof Error ? caughtError.message : "Could not save this record.";
    } finally {
      window.clearTimeout(timeout);
      setIsSaving(false);
    }

    if (saveError) {
      setRows((currentRows) => {
        const nextRows = currentRows.filter((row) => row.id !== optimisticRow.id);
        if (cacheKey) rowsCache.set(cacheKey, nextRows);
        return nextRows;
      });
      fields.forEach((field) => {
        const control = form.elements.namedItem(field.name);

        if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) {
          control.value = String(payload[field.name] ?? "");
        }
      });
      setError(controller.signal.aborted ? "Saving timed out. Please try again." : saveError);
      return;
    }
  }

  async function deleteRow(id: string | number | null) {
    if (!id) return;
    const { error: deleteError } = await supabase.from(table).delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setRows((currentRows) => {
      const nextRows = currentRows.filter((row) => row.id !== id);
      if (cacheKey) rowsCache.set(cacheKey, nextRows);
      return nextRows;
    });
  }

  function exportCsv() {
    const keys = fields.map((field) => field.name);
    const csv = [
      fields.map((field) => csvEscape(field.label)).join(","),
      ...filteredRows.map((row) => keys.map((key) => csvEscape(row[key])).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${table}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="dashboard-module-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="dashboard-module-hero rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">{eyebrow}</p>
        <div className="mt-3 grid gap-5 xl:grid-cols-[1fr_420px]">
          <div>
            <h2 className="text-3xl font-semibold tracking-normal text-slate-950">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Records" value={String(rows.length)} />
            <Metric label={moneyKey ? "Total" : "Visible"} value={moneyKey ? formatCurrencyAmount(totalMoney, currency) : String(filteredRows.length)} />
            <Metric label={statusKey ? "Active" : "Filtered"} value={String(activeCount)} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={handleSave} className="dashboard-module-form rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <h3 className="font-semibold text-slate-950">{actionLabel}</h3>
          <div className="mt-5 grid gap-4">
            {fields.map((field) => (
              <FieldInput key={field.name} field={field} />
            ))}
            {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100" role="alert">{error}</p> : null}
            <button disabled={!companyId || isSaving} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300">
              <Plus size={17} />
              {isSaving ? "Saving..." : actionLabel}
            </button>
          </div>
        </form>

        <section className="dashboard-module-records rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-300 px-3 text-sm text-slate-500 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 sm:max-w-sm">
              <Search size={17} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} className="w-full bg-transparent outline-none" />
            </label>
            <button type="button" onClick={exportCsv} disabled={!filteredRows.length} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <Download size={16} />
              Export
            </button>
          </div>

          <div className={`mt-5 grid gap-4 ${variant === "ledger" ? "lg:grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3"}`}>
            {isLoading ? Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4" role="status" aria-label="Loading records">
                <div className="h-4 w-2/5 rounded-full bg-slate-200" />
                <div className="mt-4 h-3 w-3/4 rounded-full bg-slate-200" />
                <div className="mt-3 h-7 w-1/2 rounded-full bg-slate-200" />
              </div>
            )) : filteredRows.map((row) => (
              <article key={String(row.id)} className="rounded-2xl border border-slate-200 bg-[#f7fbff] p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{String(row[titleKey] ?? "Untitled")}</p>
                    {moneyKey ? <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">{formatCurrencyAmount(Number(row[moneyKey] ?? 0), currency)}</p> : null}
                    {dateKey && row[dateKey] ? <p className="mt-2 text-sm font-semibold text-blue-700">{String(row[dateKey])}</p> : null}
                  </div>
                  <button type="button" onClick={() => void deleteRow(row.id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50" aria-label="Delete record">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {statusKey && row[statusKey] ? <Chip>{String(row[statusKey])}</Chip> : null}
                  {metaKeys.map((key) => row[key] ? <Chip key={key}>{String(row[key])}</Chip> : null)}
                </div>
              </article>
            ))}
          </div>
          {!isLoading && !filteredRows.length ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No records yet.
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function FieldInput({ field }: { field: Field }) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700">{field.label}</span>
      {field.type === "textarea" ? (
        <textarea name={field.name} required={field.required} rows={4} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
      ) : field.type === "select" ? (
        <select name={field.name} required={field.required} defaultValue={field.options?.[0]?.toLowerCase() ?? ""} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm capitalize outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
          {field.options?.map((option) => <option key={option} value={option.toLowerCase()}>{option}</option>)}
        </select>
      ) : (
        <input name={field.name} type={field.type ?? "text"} required={field.required} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
      )}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{children}</span>;
}
