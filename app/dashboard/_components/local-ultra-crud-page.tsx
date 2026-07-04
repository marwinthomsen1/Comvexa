"use client";

import { FormEvent, useMemo, useState } from "react";
import { Download, Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { PlanGate } from "./plan-gate";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select";
  required?: boolean;
  options?: string[];
};

type Column = {
  key: string;
  label: string;
};

type LocalUltraCrudPageProps = {
  moduleName: string;
  title: string;
  description: string;
  storageKey: string;
  actionLabel: string;
  fields: Field[];
  columns: Column[];
  metrics?: Array<{ label: string; valueFrom: string }>;
};

type LocalRecord = Record<string, string> & {
  id: string;
  status: string;
  createdAt: string;
};

const statusOptions = ["planned", "active", "waiting", "done"];

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function LocalUltraCrudPage({
  moduleName,
  title,
  description,
  storageKey,
  actionLabel,
  fields,
  columns,
  metrics = [],
}: LocalUltraCrudPageProps) {
  const [records, setRecords] = useState<LocalRecord[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const saved = window.localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [editingRecord, setEditingRecord] = useState<LocalRecord | null>(null);
  const [search, setSearch] = useState("");

  function persist(nextRecords: LocalRecord[]) {
    setRecords(nextRecords);
    window.localStorage.setItem(storageKey, JSON.stringify(nextRecords));
  }

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return records;
    }

    return records.filter((record) =>
      Object.values(record).some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [records, search]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(fields.map((field) => [field.name, String(formData.get(field.name) ?? "")]));
    const status = String(formData.get("status") ?? "planned");

    if (editingRecord) {
      persist(records.map((record) => (record.id === editingRecord.id ? { ...record, ...values, status } : record)));
      setEditingRecord(null);
      event.currentTarget.reset();
      return;
    }

    persist([
      {
        id: crypto.randomUUID(),
        status,
        createdAt: new Date().toISOString(),
        ...values,
      },
      ...records,
    ]);
    event.currentTarget.reset();
  }

  function deleteRecord(id: string) {
    persist(records.filter((record) => record.id !== id));
  }

  function exportCsv() {
    const headers = [...columns.map((column) => column.label), "Status", "Created"];
    const keys = [...columns.map((column) => column.key), "status", "createdAt"];
    const csv = [
      headers.map(csvEscape).join(","),
      ...filteredRecords.map((record) => keys.map((key) => csvEscape(String(record[key] ?? ""))).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${storageKey}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const completed = records.filter((record) => record.status === "done").length;
  const active = records.filter((record) => record.status === "active").length;

  return (
    <PlanGate moduleName={moduleName}>
      <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Ultra module</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal text-slate-950">{title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!filteredRecords.length}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Total records" value={String(records.length)} />
            <Metric label="Active" value={String(active)} />
            <Metric label="Done" value={String(completed)} />
            <Metric label={metrics[0]?.label ?? "Completion"} value={records.length ? `${Math.round((completed / records.length) * 100)}%` : "0%"} />
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[390px_1fr]">
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-950">{editingRecord ? "Edit record" : actionLabel}</h3>
                <p className="mt-1 text-sm text-slate-500">Saved to this workspace browser.</p>
              </div>
              {editingRecord ? (
                <button type="button" onClick={() => setEditingRecord(null)} className="rounded-xl border border-slate-200 p-2 text-slate-500">
                  <X size={17} />
                </button>
              ) : null}
            </div>
            <div className="mt-5 grid gap-4">
              {fields.map((field) => (
                <FieldInput key={`${editingRecord?.id ?? "new"}-${field.name}`} field={field} value={editingRecord?.[field.name] ?? ""} />
              ))}
              <FieldInput
                key={`${editingRecord?.id ?? "new"}-status`}
                field={{ name: "status", label: "Status", type: "select", options: statusOptions }}
                value={editingRecord?.status ?? "planned"}
              />
              <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700">
                {editingRecord ? <Edit3 size={17} /> : <Plus size={17} />}
                {editingRecord ? "Save changes" : actionLabel}
              </button>
            </div>
          </form>

          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-semibold text-slate-950">Records</h3>
                <p className="mt-1 text-sm text-slate-500">{filteredRecords.length} / {records.length}</p>
              </div>
              <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-300 px-3 text-sm text-slate-500 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100 lg:w-80">
                <Search size={17} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records" className="w-full bg-transparent outline-none" />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    {columns.map((column) => <th key={column.key} className="px-5 py-4 font-semibold">{column.label}</th>)}
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-emerald-50/40">
                      {columns.map((column, index) => (
                        <td key={column.key} className={`px-5 py-4 ${index === 0 ? "font-medium text-slate-950" : "text-slate-600"}`}>{record[column.key] || "-"}</td>
                      ))}
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">{record.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setEditingRecord(record)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                          <button type="button" onClick={() => deleteRecord(record.id)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredRecords.length ? (
                    <tr>
                      <td colSpan={columns.length + 2} className="px-5 py-14 text-center text-sm text-slate-500">No records yet.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
    </PlanGate>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#f7fbff] p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">{value}</p>
    </div>
  );
}

function FieldInput({ field, value }: { field: Field; value: string }) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700">{field.label}</span>
      {field.type === "textarea" ? (
        <textarea name={field.name} required={field.required} defaultValue={value} rows={4} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
      ) : field.type === "select" ? (
        <select name={field.name} required={field.required} defaultValue={value || field.options?.[0] || ""} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm capitalize outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100">
          {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input name={field.name} type={field.type ?? "text"} required={field.required} defaultValue={value} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
      )}
    </label>
  );
}
