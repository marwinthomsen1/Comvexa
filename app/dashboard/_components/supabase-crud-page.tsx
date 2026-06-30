"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

type Column = {
  key: string;
  label: string;
  format?: "currency" | "date";
};

type SupabaseCrudPageProps = {
  table: string;
  title: string;
  description: string;
  actionLabel: string;
  fields: Field[];
  columns: Column[];
  defaultValues?: Record<string, string | number>;
};

type Row = Record<string, string | number | null>;

function formatValue(value: string | number | null, format?: Column["format"]) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (format === "currency") {
    return `$${Number(value).toLocaleString()}`;
  }

  if (format === "date") {
    return new Date(String(value)).toLocaleDateString("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return String(value);
}

export function SupabaseCrudPage({
  table,
  title,
  description,
  actionLabel,
  fields,
  columns,
  defaultValues = {},
}: SupabaseCrudPageProps) {
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const filteredRows = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    if (!searchTerm) {
      return rows;
    }

    return rows.filter((row) =>
      Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(searchTerm)),
    );
  }, [rows, search]);

  async function loadRows() {
    setError("");
    setIsLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setError("You must be logged in to view this page.");
      setIsLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.company_id) {
      setError("Your profile is not connected to a company yet.");
      setIsLoading(false);
      return;
    }

    setCompanyId(profile.company_id);

    const { data, error: rowsError } = await supabase
      .from(table)
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    if (rowsError) {
      setError(rowsError.message);
      setIsLoading(false);
      return;
    }

    setRows((data ?? []) as Row[]);
    setIsLoading(false);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadRows();
    }, 0);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!companyId) {
      setError("Your company workspace is not ready yet.");
      return;
    }

    setError("");
    setIsSaving(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload: Record<string, string | number | null> = {
      company_id: companyId,
      ...defaultValues,
    };

    fields.forEach((field) => {
      const rawValue = String(formData.get(field.name) ?? "").trim();

      if (field.type === "number") {
        payload[field.name] = rawValue ? Number(rawValue) : null;
        return;
      }

      payload[field.name] = rawValue || null;
    });

    const { error: insertError } = await supabase.from(table).insert(payload);

    setIsSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    form.reset();
    await loadRows();
  }

  async function handleDelete(id: string | number | null) {
    if (!id) {
      return;
    }

    setError("");
    const { error: deleteError } = await supabase.from(table).delete().eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setRows((currentRows) => currentRows.filter((row) => row.id !== id));
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Live Supabase module
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <button
            type="button"
            onClick={loadRows}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleCreate} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {fields.map((field) => (
            <label key={field.name} className={field.type === "textarea" ? "xl:col-span-2" : ""}>
              <span className="text-sm font-medium text-slate-700">{field.label}</span>
              {field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  required={field.required}
                  placeholder={field.placeholder}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              ) : field.type === "select" ? (
                <select
                  name={field.name}
                  required={field.required}
                  defaultValue={field.options?.[0] ?? ""}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  {field.options?.map((option) => (
                    <option key={option} value={option.toLowerCase()}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.name}
                  type={field.type ?? "text"}
                  required={field.required}
                  placeholder={field.placeholder}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              )}
            </label>
          ))}
          <button
            type="submit"
            disabled={isSaving || !companyId}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 md:self-end"
          >
            <Plus size={16} />
            {isSaving ? "Saving..." : actionLabel}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold tracking-normal text-slate-950">Records</h3>
            <p className="mt-1 text-sm text-slate-500">
              {isLoading ? "Loading records..." : `${filteredRows.length} records in this company workspace.`}
            </p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search records"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 sm:w-64"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-5 py-3 font-semibold">
                    {column.label}
                  </th>
                ))}
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr key={String(row.id)} className="hover:bg-slate-50">
                  {columns.map((column, columnIndex) => (
                    <td
                      key={column.key}
                      className={`px-5 py-4 ${
                        columnIndex === 0 ? "font-medium text-slate-950" : "text-slate-600"
                      }`}
                    >
                      {formatValue(row[column.key], column.format)}
                    </td>
                  ))}
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-sm text-slate-500">
                    No records yet. Add your first one above.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
