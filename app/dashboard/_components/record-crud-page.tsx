"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Copy, Download, Edit3, Layers3, Plus, RefreshCw, RotateCcw, Search, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
import { formatCurrencyAmount } from "@/app/_components/currency-display";
import { useDashboardText } from "./dashboard-i18n";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  advanced?: boolean;
};

type Column = {
  key: string;
  label: string;
  format?: "currency" | "date";
};

type RecordCrudPageProps = {
  table: string;
  title: string;
  description: string;
  actionLabel: string;
  fields: Field[];
  columns: Column[];
  defaultValues?: Record<string, string | number>;
};

type Row = Record<string, string | number | null>;

type RecordFormatSettings = {
  currency: string;
  dateFormat: string;
};

const defaultFormatSettings: RecordFormatSettings = {
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
};

function readFormatSettings() {
  try {
    const saved = window.localStorage.getItem("comvexa-workspace-settings");
    return saved ? { ...defaultFormatSettings, ...JSON.parse(saved) } : defaultFormatSettings;
  } catch {
    return defaultFormatSettings;
  }
}

function dateFormatOptions(dateFormat: string): Intl.DateTimeFormatOptions {
  if (dateFormat === "YYYY-MM-DD") {
    return { year: "numeric", month: "2-digit", day: "2-digit" };
  }

  return { year: "numeric", month: "short", day: "numeric" };
}

function formatValue(value: string | number | null, format: Column["format"] | undefined, settings: RecordFormatSettings) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (format === "currency") {
    return formatCurrencyAmount(Number(value), settings.currency, false, 2);
  }

  if (format === "date") {
    const date = new Date(String(value));

    if (settings.dateFormat === "YYYY-MM-DD") {
      return date.toISOString().slice(0, 10);
    }

    return date.toLocaleDateString(settings.dateFormat === "DD/MM/YYYY" ? "en-GB" : "en-US", dateFormatOptions(settings.dateFormat));
  }

  return String(value);
}

function csvEscape(value: string | number | null) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function RecordCrudPage({
  table,
  title,
  description,
  actionLabel,
  fields,
  columns,
  defaultValues = {},
}: RecordCrudPageProps) {
  const { translate } = useDashboardText();
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formatSettings, setFormatSettings] = useState<RecordFormatSettings>(defaultFormatSettings);
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [draftRow, setDraftRow] = useState<Row | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Array<string | number>>([]);

  const filteredRows = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    if (!searchTerm) {
      return rows;
    }

    return rows.filter((row) =>
      Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(searchTerm)),
    );
  }, [rows, search]);

  const visibleCount = filteredRows.length;
  const selectedCount = selectedRows.length;
  const visibleIds = filteredRows.map((row) => row.id).filter((id): id is string | number => id !== null && id !== undefined);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedRows.includes(id));
  const requiredFields = fields.filter((field) => field.required).length;
  const primaryFields = fields.filter((field) => !field.advanced);
  const advancedFields = fields.filter((field) => field.advanced);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    setSelectedRows([]);
    setIsLoading(false);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadRows();
      setFormatSettings(readFormatSettings());
    }, 0);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  useEffect(() => {
    function syncFormatSettings() {
      setFormatSettings(readFormatSettings());
    }

    window.addEventListener("storage", syncFormatSettings);
    window.addEventListener("comvexa-settings-change", syncFormatSettings);

    return () => {
      window.removeEventListener("storage", syncFormatSettings);
      window.removeEventListener("comvexa-settings-change", syncFormatSettings);
    };
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
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

    const saveRequest = editingRow?.id
      ? supabase.from(table).update(payload).eq("id", editingRow.id)
      : supabase.from(table).insert(payload);

    const { error: saveError } = await saveRequest;

    setIsSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    form.reset();
    setEditingRow(null);
    setDraftRow(null);
    setFormVersion((current) => current + 1);
    await loadRows();
  }

  async function handleDuplicate(row: Row) {
    if (!companyId) {
      setError("Your company workspace is not ready yet.");
      return;
    }

    const payload: Record<string, string | number | null> = {
      company_id: companyId,
      ...defaultValues,
    };

    fields.forEach((field) => {
      payload[field.name] = row[field.name] ?? null;
    });

    const { error: duplicateError } = await supabase.from(table).insert(payload);

    if (duplicateError) {
      setError(duplicateError.message);
      return;
    }

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
    setSelectedRows((current) => current.filter((selectedId) => selectedId !== id));
  }

  async function handleBulkDelete() {
    if (!selectedRows.length) {
      return;
    }

    setError("");
    const { error: deleteError } = await supabase.from(table).delete().in("id", selectedRows);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setRows((currentRows) => currentRows.filter((row) => !selectedRows.includes(row.id ?? "")));
    setSelectedRows([]);
  }

  function toggleRow(id: string | number | null) {
    if (!id) {
      return;
    }

    setSelectedRows((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleAllVisible() {
    setSelectedRows((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  }

  function exportCsv() {
    const headers = columns.map((column) => column.label);
    const lines = [
      headers.map(csvEscape).join(","),
      ...filteredRows.map((row) =>
        columns.map((column) => csvEscape(formatValue(row[column.key], column.format, formatSettings))).join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${table}-export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearForm() {
    setEditingRow(null);
    setDraftRow(null);
    setShowAdvanced(false);
    setFormVersion((current) => current + 1);
  }

  function useLatestAsTemplate() {
    const latest = rows[0];

    if (!latest) {
      return;
    }

    const template: Row = {};
    fields.forEach((field) => {
      template[field.name] = latest[field.name] ?? null;
    });
    setEditingRow(null);
    setDraftRow(template);
    setShowAdvanced(true);
    setFormVersion((current) => current + 1);
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="grid gap-0 xl:grid-cols-[1fr_420px]">
          <div className="bg-gradient-to-br from-white via-slate-50 to-emerald-50/70 p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700">
                  <Sparkles size={14} />
                  {translate("Workspace module")}
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
                  {translate(title)}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{translate(description)}</p>
              </div>
              <button
                type="button"
                onClick={loadRows}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{translate("Total records")}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{isLoading ? "-" : rows.length}</p>
                <p className="mt-1 text-sm text-slate-500">{translate("Saved in this workspace")}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{translate("Visible now")}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{isLoading ? "-" : visibleCount}</p>
                <p className="mt-1 text-sm text-slate-500">{translate("After search filters")}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{translate("Required fields")}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{requiredFields}</p>
                <p className="mt-1 text-sm text-slate-500">{translate("Needed to create a record")}</p>
              </div>
            </div>

            {error ? (
              <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
          </div>

          <aside className="border-t border-slate-200 bg-white p-6 xl:border-l xl:border-t-0 sm:p-8">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-950">{translate("Workspace protected")}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {translate("Records created here stay attached to the signed-in company workspace.")}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                {editingRow ? <Edit3 size={21} /> : <Wand2 size={21} />}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                  {editingRow ? translate("Edit record") : translate("Record builder")}
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-normal text-slate-950">
                  {editingRow ? translate("Update this entry") : `${translate("Create")} ${translate(title).toLowerCase()}`}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {editingRow
                    ? translate("Change the fields below and save the updated record.")
                    : translate("Use quick tools, required fields, and optional details to create a cleaner business record.")}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={useLatestAsTemplate}
                disabled={!rows.length || Boolean(editingRow)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 shadow-sm hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-3">
                  <Layers3 size={17} className="text-emerald-700" />
                  Use latest as template
                </span>
                <ChevronDown size={16} className="-rotate-90 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={clearForm}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <RotateCcw size={17} className="text-slate-500" />
                Clear draft
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-white p-3 ring-1 ring-emerald-100">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Required</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{requiredFields}</p>
              </div>
              <div className="rounded-2xl bg-white p-3 ring-1 ring-emerald-100">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Optional</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{advancedFields.length}</p>
              </div>
            </div>
          </div>

          <form key={`${String(editingRow?.id ?? "new")}-${formVersion}`} onSubmit={handleSave} className="mt-5 grid gap-4">
            <FieldList fields={primaryFields} translate={translate} row={editingRow ?? draftRow} />

            {advancedFields.length ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((current) => !current)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800"
                >
                  <span>{translate("Additional information")}</span>
                  <ChevronDown
                    size={17}
                    className={`transition ${showAdvanced ? "rotate-180" : ""}`}
                  />
                </button>
                {showAdvanced ? (
                  <div className="grid gap-4 border-t border-slate-200 p-4">
                    <FieldList fields={advancedFields} translate={translate} row={editingRow ?? draftRow} />
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="submit"
                disabled={isSaving || !companyId}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {editingRow ? <Edit3 size={17} /> : <Plus size={17} />}
                {isSaving ? `${translate("Saving")}...` : editingRow ? translate("Save changes") : translate(actionLabel)}
              </button>
              {editingRow ? (
                <button
                  type="button"
                  onClick={clearForm}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <X size={17} />
                  {translate("Cancel")}
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-normal text-slate-950">{translate("Records")}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {isLoading ? translate("Loading records...") : `${visibleCount} / ${rows.length}`}
                {selectedCount ? ` - ${selectedCount} selected` : ""}
              </p>
            </div>
            <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-500 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100 lg:w-80">
              <Search size={17} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={translate("Search records")}
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
              />
            </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportCsv}
                disabled={!filteredRows.length}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={14} />
                {translate("Export CSV")}
              </button>
              {selectedCount ? (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  <Trash2 size={14} />
                  {translate("Delete selected")}
                </button>
              ) : null}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="Select visible records"
                    />
                  </th>
                  {columns.map((column) => (
                    <th key={column.key} className="px-5 py-4 font-semibold">
                      {translate(column.label)}
                    </th>
                  ))}
                  <th className="px-5 py-4 font-semibold">{translate("Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr key={String(row.id)} className="hover:bg-emerald-50/40">
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={row.id !== null && row.id !== undefined && selectedRows.includes(row.id)}
                        onChange={() => toggleRow(row.id)}
                        aria-label="Select record"
                      />
                    </td>
                    {columns.map((column, columnIndex) => (
                      <td
                        key={column.key}
                        data-no-translate={column.format === "currency" ? true : undefined}
                        className={`px-5 py-4 ${
                          columnIndex === 0 ? "font-medium text-slate-950" : "text-slate-600"
                        }`}
                      >
                        {formatValue(row[column.key], column.format, formatSettings)}
                      </td>
                    ))}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRow(row);
                            setShowAdvanced(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Edit3 size={14} />
                          {translate("Edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(row)}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          <Copy size={14} />
                          {translate("Duplicate")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                          {translate("Delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 2} className="px-5 py-14 text-center">
                      <div className="mx-auto max-w-sm rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
                        <Plus className="mx-auto text-slate-400" size={26} />
                        <p className="mt-3 font-semibold text-slate-950">{translate("No records yet")}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {translate("Add your first entry from the form on the left and it will appear here.")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function FieldList({
  fields,
  translate,
  row,
}: {
  fields: Field[];
  translate: (label: string) => string;
  row: Row | null;
}) {
  return (
    <>
      {fields.map((field) => {
        const defaultValue = row?.[field.name] ?? "";

        return (
        <label key={field.name}>
          <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
            {translate(field.label)}
            {field.required ? (
              <span className="text-xs font-semibold text-emerald-700">{translate("Required")}</span>
            ) : null}
          </span>
          {field.type === "textarea" ? (
            <textarea
              name={field.name}
              required={field.required}
              placeholder={field.placeholder}
              defaultValue={String(defaultValue)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          ) : field.type === "select" ? (
            <select
              name={field.name}
              required={field.required}
              defaultValue={String(defaultValue || field.options?.[0]?.toLowerCase() || "")}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              {field.options?.map((option) => (
                <option key={option} value={option.toLowerCase()}>
                  {translate(option)}
                </option>
              ))}
            </select>
          ) : (
            <input
              name={field.name}
              type={field.type ?? "text"}
              required={field.required}
              placeholder={field.placeholder}
              defaultValue={String(defaultValue)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          )}
        </label>
        );
      })}
    </>
  );
}
