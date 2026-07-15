"use client";

import { FormEvent, useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowRight, BarChart3, Bell, Boxes, Building2, CalendarClock, CalendarDays, CheckCircle2, CheckCheck, ChevronLeft, ChevronRight, CircleUserRound, Clock3, CreditCard, Database, Download, Edit3, Eye, Factory, FileQuestion, FileSpreadsheet, FileText, Fingerprint, History, Inbox, Landmark, Mail, MessageCircle, MonitorSmartphone, PackageCheck, Paintbrush, Palette, Pause, Percent, Play, Plus, ReceiptText, RefreshCw, Route, Rows3, Scale, Search, ShieldAlert, Sparkles, ThumbsDown, ThumbsUp, TimerOff, Trash2, TrendingUp, Truck, UploadCloud, UserCheck, Workflow, X, Zap } from "lucide-react";
import { formatCurrencyAmount } from "@/app/_components/currency-display";
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
  variant?: "default" | "attendance" | "procurement" | "portal" | "analytics" | "automation" | "audit" | "approvals" | "white-label" | "data-import";
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
  variant = "default",
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
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getLocalTodayKey());

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
      if (variant === "attendance" || variant === "procurement" || variant === "portal" || variant === "analytics" || variant === "automation" || variant === "audit" || variant === "approvals" || variant === "white-label" || variant === "data-import") setShowForm(false);
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
    if (variant === "attendance" || variant === "procurement" || variant === "portal" || variant === "analytics" || variant === "automation" || variant === "audit" || variant === "approvals" || variant === "white-label" || variant === "data-import") {
      if (values.date) setSelectedDate(values.date);
      setShowForm(false);
    }
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

  if (variant === "attendance") {
    return (
      <PlanGate moduleName={moduleName}>
        <AttendanceDashboard
          records={filteredRecords}
          allRecords={records}
          fields={fields}
          actionLabel={actionLabel}
          editingRecord={editingRecord}
          search={search}
          selectedDate={selectedDate}
          showForm={showForm}
          onSearchChange={setSearch}
          onDateChange={setSelectedDate}
          onShowForm={() => { setEditingRecord(null); setShowForm(true); }}
          onCloseForm={() => { setEditingRecord(null); setShowForm(false); }}
          onEdit={(record) => { setEditingRecord(record); setShowForm(true); }}
          onDelete={deleteRecord}
          onExport={exportCsv}
          onSubmit={handleSubmit}
        />
      </PlanGate>
    );
  }

  if (variant === "procurement") {
    return (
      <PlanGate moduleName={moduleName}>
        <ProcurementDashboard
          records={filteredRecords}
          allRecords={records}
          fields={fields}
          actionLabel={actionLabel}
          editingRecord={editingRecord}
          search={search}
          showForm={showForm}
          onSearchChange={setSearch}
          onShowForm={() => { setEditingRecord(null); setShowForm(true); }}
          onCloseForm={() => { setEditingRecord(null); setShowForm(false); }}
          onEdit={(record) => { setEditingRecord(record); setShowForm(true); }}
          onDelete={deleteRecord}
          onExport={exportCsv}
          onSubmit={handleSubmit}
          onStatusChange={(id, status) => persist(records.map((record) => record.id === id ? { ...record, status } : record))}
        />
      </PlanGate>
    );
  }

  if (variant === "portal") {
    return (
      <PlanGate moduleName={moduleName}>
        <PortalExperienceDashboard
          records={filteredRecords}
          allRecords={records}
          fields={fields}
          actionLabel={actionLabel}
          editingRecord={editingRecord}
          search={search}
          showForm={showForm}
          onSearchChange={setSearch}
          onShowForm={() => { setEditingRecord(null); setShowForm(true); }}
          onCloseForm={() => { setEditingRecord(null); setShowForm(false); }}
          onEdit={(record) => { setEditingRecord(record); setShowForm(true); }}
          onDelete={deleteRecord}
          onExport={exportCsv}
          onSubmit={handleSubmit}
          onStatusChange={(id, status) => persist(records.map((record) => record.id === id ? { ...record, status } : record))}
        />
      </PlanGate>
    );
  }

  if (variant === "analytics") {
    return (
      <PlanGate moduleName={moduleName}>
        <BranchAnalyticsDashboard
          records={filteredRecords}
          allRecords={records}
          fields={fields}
          actionLabel={actionLabel}
          editingRecord={editingRecord}
          search={search}
          showForm={showForm}
          onSearchChange={setSearch}
          onShowForm={() => { setEditingRecord(null); setShowForm(true); }}
          onCloseForm={() => { setEditingRecord(null); setShowForm(false); }}
          onEdit={(record) => { setEditingRecord(record); setShowForm(true); }}
          onDelete={deleteRecord}
          onExport={exportCsv}
          onSubmit={handleSubmit}
        />
      </PlanGate>
    );
  }

  if (variant === "automation") {
    return (
      <PlanGate moduleName={moduleName}>
        <AutomationFlowDashboard
          records={filteredRecords}
          allRecords={records}
          fields={fields}
          actionLabel={actionLabel}
          editingRecord={editingRecord}
          search={search}
          showForm={showForm}
          onSearchChange={setSearch}
          onShowForm={() => { setEditingRecord(null); setShowForm(true); }}
          onCloseForm={() => { setEditingRecord(null); setShowForm(false); }}
          onEdit={(record) => { setEditingRecord(record); setShowForm(true); }}
          onDelete={deleteRecord}
          onExport={exportCsv}
          onSubmit={handleSubmit}
          onStatusChange={(id, status) => persist(records.map((record) => record.id === id ? { ...record, status } : record))}
        />
      </PlanGate>
    );
  }

  if (variant === "audit") {
    return (
      <PlanGate moduleName={moduleName}>
        <AuditTrailDashboard
          records={filteredRecords}
          allRecords={records}
          fields={fields}
          actionLabel={actionLabel}
          editingRecord={editingRecord}
          search={search}
          showForm={showForm}
          onSearchChange={setSearch}
          onShowForm={() => { setEditingRecord(null); setShowForm(true); }}
          onCloseForm={() => { setEditingRecord(null); setShowForm(false); }}
          onEdit={(record) => { setEditingRecord(record); setShowForm(true); }}
          onDelete={deleteRecord}
          onExport={exportCsv}
          onSubmit={handleSubmit}
        />
      </PlanGate>
    );
  }

  if (variant === "approvals") {
    return (
      <PlanGate moduleName={moduleName}>
        <ApprovalDecisionDesk
          records={filteredRecords}
          allRecords={records}
          fields={fields}
          actionLabel={actionLabel}
          editingRecord={editingRecord}
          search={search}
          showForm={showForm}
          onSearchChange={setSearch}
          onShowForm={() => { setEditingRecord(null); setShowForm(true); }}
          onCloseForm={() => { setEditingRecord(null); setShowForm(false); }}
          onEdit={(record) => { setEditingRecord(record); setShowForm(true); }}
          onDelete={deleteRecord}
          onExport={exportCsv}
          onSubmit={handleSubmit}
          onStatusChange={(id, status) => persist(records.map((record) => record.id === id ? { ...record, status } : record))}
        />
      </PlanGate>
    );
  }

  if (variant === "white-label") {
    return (
      <PlanGate moduleName={moduleName}>
        <WhiteLabelBrandStudio
          records={filteredRecords}
          allRecords={records}
          fields={fields}
          actionLabel={actionLabel}
          editingRecord={editingRecord}
          search={search}
          showForm={showForm}
          onSearchChange={setSearch}
          onShowForm={() => { setEditingRecord(null); setShowForm(true); }}
          onCloseForm={() => { setEditingRecord(null); setShowForm(false); }}
          onEdit={(record) => { setEditingRecord(record); setShowForm(true); }}
          onDelete={deleteRecord}
          onExport={exportCsv}
          onSubmit={handleSubmit}
          onStatusChange={(id, status) => persist(records.map((record) => record.id === id ? { ...record, status } : record))}
        />
      </PlanGate>
    );
  }

  if (variant === "data-import") {
    return (
      <PlanGate moduleName={moduleName}>
        <DataMigrationCenter
          records={filteredRecords}
          allRecords={records}
          fields={fields}
          actionLabel={actionLabel}
          editingRecord={editingRecord}
          search={search}
          showForm={showForm}
          onSearchChange={setSearch}
          onShowForm={() => { setEditingRecord(null); setShowForm(true); }}
          onCloseForm={() => { setEditingRecord(null); setShowForm(false); }}
          onEdit={(record) => { setEditingRecord(record); setShowForm(true); }}
          onDelete={deleteRecord}
          onExport={exportCsv}
          onSubmit={handleSubmit}
          onStatusChange={(id, status) => persist(records.map((record) => record.id === id ? { ...record, status } : record))}
        />
      </PlanGate>
    );
  }

  return (
    <PlanGate moduleName={moduleName}>
      <main className="dashboard-module-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
        <section className="dashboard-module-hero rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
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
          <form onSubmit={handleSubmit} className="dashboard-module-form rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
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

          <section className="dashboard-module-records overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
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

function DataMigrationCenter({
  records,
  allRecords,
  fields,
  actionLabel,
  editingRecord,
  search,
  showForm,
  onSearchChange,
  onShowForm,
  onCloseForm,
  onEdit,
  onDelete,
  onExport,
  onSubmit,
  onStatusChange,
}: {
  records: LocalRecord[];
  allRecords: LocalRecord[];
  fields: Field[];
  actionLabel: string;
  editingRecord: LocalRecord | null;
  search: string;
  showForm: boolean;
  onSearchChange: (value: string) => void;
  onShowForm: () => void;
  onCloseForm: () => void;
  onEdit: (record: LocalRecord) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [page, setPage] = useState(1);
  const types = ["customers", "employees", "inventory", "invoices", "payments", "expenses"];
  const filtered = records.filter((record) => (typeFilter === "all" || record.recordType === typeFilter) && (stageFilter === "all" || record.status === stageFilter));
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRecords = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalRows = allRecords.reduce((sum, record) => sum + Number(record.rows || 0), 0);
  const completedRows = allRecords.filter((record) => record.status === "done").reduce((sum, record) => sum + Number(record.rows || 0), 0);
  const running = allRecords.filter((record) => record.status === "active").length;
  const needsReview = allRecords.filter((record) => record.status === "waiting").length;
  const completion = totalRows ? Math.round((completedRows / totalRows) * 100) : 0;

  return (
    <main className="migration-center-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="dashboard-custom-hero migration-command-header overflow-hidden rounded-[2rem] border border-[#214666] bg-[#0b2237] p-6 text-white shadow-xl shadow-slate-900/10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-end">
          <div><div className="flex items-center gap-2 text-[#62d6ff]"><Database size={18} /><p className="text-xs font-bold uppercase tracking-[0.2em]">Migration command center</p></div><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Move your data with a clear runway</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#a8bfd1]">Plan each source, validate its mapping, track row volume, and move clean records into the right Comvexa module.</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={onShowForm} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#31b9e8] px-4 text-sm font-semibold text-[#062034] hover:bg-[#62d6ff]"><UploadCloud size={17} />Plan an import</button><button type="button" onClick={onExport} disabled={!records.length} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-40"><Download size={16} />Export log</button></div></div>
          <div className="grid grid-cols-2 gap-3"><MigrationMetric label="Rows staged" value={formatCompactNumber(totalRows)} icon={Rows3} /><MigrationMetric label="Rows moved" value={formatCompactNumber(completedRows)} icon={CheckCheck} /><MigrationMetric label="Running" value={String(running)} icon={RefreshCw} active={running > 0} /><MigrationMetric label="Completion" value={`${completion}%`} icon={TrendingUp} /></div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="migration-toolbar rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"><div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]"><label className="flex h-11 items-center gap-3 rounded-xl bg-slate-50 px-3 text-slate-500 ring-1 ring-inset ring-slate-200 focus-within:ring-cyan-500"><Search size={16} /><input value={search} onChange={(event) => { onSearchChange(event.target.value); setPage(1); }} placeholder="Search source, owner, or mapping" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold capitalize text-slate-600 outline-none"><option value="all">All destinations</option>{types.map((type) => <option key={type} value={type}>{type}</option>)}</select><select value={stageFilter} onChange={(event) => { setStageFilter(event.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"><option value="all">All stages</option><option value="planned">Draft</option><option value="waiting">Validation</option><option value="active">Importing</option><option value="done">Complete</option></select></div></div>

          <div className="migration-job-stack mt-4 space-y-4">
            {visibleRecords.length ? visibleRecords.map((record) => {
              const stage = getMigrationStage(record.status);
              const next = getNextMigrationAction(record.status);
              return <article key={record.id} className="migration-job-card overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="grid size-10 place-items-center rounded-2xl bg-[#e5f7fd] text-[#087fa8]"><FileSpreadsheet size={18} /></span><div className="min-w-0"><p className="truncate text-base font-semibold text-slate-950">{record.source || "Untitled source"}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">To {record.recordType || "unassigned destination"}</p></div></div><div className="mt-4 grid grid-cols-3 gap-2"><MigrationJobDetail label="Rows" value={formatCompactNumber(Number(record.rows || 0))} /><MigrationJobDetail label="Owner" value={record.owner || "Unassigned"} /><MigrationJobDetail label="Target" value={formatMigrationDate(record.targetDate)} /></div></div>
                  <div><div className="flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${stage.badge}`}>{stage.label}</span><span className="text-xs font-semibold text-slate-500">{stage.progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${stage.bar}`} style={{ width: `${stage.progress}%` }} /></div><div className="mt-4 flex gap-2"><button type="button" onClick={() => onStatusChange(record.id, next.status)} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b2237] text-xs font-semibold text-white hover:bg-[#153b59]">{next.icon === "refresh" ? <RefreshCw size={14} /> : next.icon === "check" ? <CheckCheck size={14} /> : <Play size={14} />}{next.label}</button><button type="button" onClick={() => onEdit(record)} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label={`Edit ${record.source}`}><Edit3 size={14} /></button><button type="button" onClick={() => onDelete(record.id)} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-300 hover:border-red-200 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${record.source}`}><Trash2 size={14} /></button></div></div></div>
                <div className="migration-pipeline border-t border-slate-100 bg-[#f8fbfd] px-5 py-4"><div className="grid grid-cols-4 gap-2"><MigrationStep label="Source" complete={stage.progress >= 25} active={stage.progress === 25} /><MigrationStep label="Map" complete={stage.progress >= 50} active={stage.progress === 50} /><MigrationStep label="Import" complete={stage.progress >= 75} active={stage.progress === 75} /><MigrationStep label="Verify" complete={stage.progress === 100} active={stage.progress === 100} /></div>{record.notes ? <p className="mt-3 truncate text-[11px] text-slate-500">Mapping: {record.notes}</p> : null}</div>
              </article>;
            }) : <div className="grid min-h-80 place-items-center rounded-[2rem] border border-dashed border-[#b8d7e4] bg-[#f4fbfd] p-8 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#def4fb] text-[#087fa8]"><UploadCloud size={29} /></span><p className="mt-4 font-semibold text-slate-900">No migration jobs in this view</p><p className="mt-1 text-sm text-slate-500">Plan a source file and its destination to begin.</p></div></div>}
          </div>
          {filtered.length > pageSize ? <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm"><p className="text-slate-500">Page {currentPage} of {pageCount}</p><div className="flex gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="grid size-9 place-items-center rounded-xl border border-slate-200 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={16} /></button><button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} className="grid size-9 place-items-center rounded-xl border border-slate-200 disabled:opacity-40" aria-label="Next page"><ChevronRight size={16} /></button></div></div> : null}
        </div>

        <aside className="migration-readiness-panel self-start rounded-[2rem] border border-[#b8d7e4] bg-[#eaf8fc] p-5 shadow-sm xl:sticky xl:top-24"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#087fa8]">Preflight check</p><h3 className="mt-2 text-xl font-semibold text-[#0b2237]">Import readiness</h3></div><Database size={22} className="text-[#0b91bd]" /></div><div className="mt-5 space-y-2"><ReadinessCheck label="Source identified" complete={allRecords.length > 0} /><ReadinessCheck label="Destination mapped" complete={allRecords.some((record) => Boolean(record.recordType))} /><ReadinessCheck label="Row count entered" complete={allRecords.some((record) => Number(record.rows) > 0)} /><ReadinessCheck label="Owner assigned" complete={allRecords.some((record) => Boolean(record.owner))} /></div><div className="mt-5 rounded-2xl bg-white/80 p-4 ring-1 ring-[#cbe4ec]"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-[#183b4d]">Needs validation</p><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{needsReview}</span></div><p className="mt-2 text-[11px] leading-5 text-[#66818e]">Review column mappings and required fields before starting an import.</p></div><div className="mt-4 rounded-2xl bg-[#0b2237] p-4 text-white"><p className="text-xs font-semibold">Safe migration order</p><ol className="mt-3 space-y-2 text-[11px] text-[#b7cbd8]"><li>1. Customers and employees</li><li>2. Inventory and invoices</li><li>3. Payments and expenses</li></ol></div></aside>
      </section>

      {showForm ? <div className="migration-form-overlay fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="migration-form-title"><button type="button" onClick={onCloseForm} className="absolute inset-0 bg-[#061521]/75 backdrop-blur-sm" aria-label="Close import form" /><form onSubmit={onSubmit} className="migration-job-form relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-[#b8d7e4] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#087fa8]">Migration planner</p><h3 id="migration-form-title" className="mt-2 text-2xl font-semibold text-[#0b2237]">{editingRecord ? "Edit import job" : actionLabel}</h3><p className="mt-1 text-sm text-slate-500">Define the source, destination, volume, and mapping notes.</p></div><button type="button" onClick={onCloseForm} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close import form"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{fields.map((field) => <div key={`${editingRecord?.id ?? "new"}-${field.name}`} className={field.type === "textarea" || field.name === "source" ? "sm:col-span-2" : ""}><FieldInput field={field} value={editingRecord?.[field.name] ?? (field.name === "targetDate" ? getLocalTodayKey() : "")} /></div>)}<button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0b2237] px-4 text-sm font-semibold text-white hover:bg-[#153b59] sm:col-span-2"><UploadCloud size={17} />{editingRecord ? "Save migration" : "Add to migration queue"}</button></div></form></div> : null}
    </main>
  );
}

function WhiteLabelBrandStudio({
  records,
  allRecords,
  fields,
  actionLabel,
  editingRecord,
  search,
  showForm,
  onSearchChange,
  onShowForm,
  onCloseForm,
  onEdit,
  onDelete,
  onExport,
  onSubmit,
  onStatusChange,
}: {
  records: LocalRecord[];
  allRecords: LocalRecord[];
  fields: Field[];
  actionLabel: string;
  editingRecord: LocalRecord | null;
  search: string;
  showForm: boolean;
  onSearchChange: (value: string) => void;
  onShowForm: () => void;
  onCloseForm: () => void;
  onEdit: (record: LocalRecord) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const assetTypes = ["invoice", "portal", "pdf", "email", "signature"];
  const visibleRecords = records.filter((record) => (typeFilter === "all" || record.type === typeFilter) && (statusFilter === "all" || (statusFilter === "ready" ? record.status === "done" : record.status !== "done")));
  const selectedRecord = allRecords.find((record) => record.id === selectedId) ?? visibleRecords[0] ?? null;
  const ready = allRecords.filter((record) => record.status === "done").length;
  const inProgress = allRecords.length - ready;
  const overdue = allRecords.filter((record) => record.status !== "done" && isApprovalOverdue(record.dueDate)).length;
  const brandColor = normalizeBrandColor(selectedRecord?.color);

  return (
    <main className="brand-studio-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="brand-studio-header overflow-hidden rounded-[2rem] border border-[#ead9cf] bg-[#fff9f4] p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#d55732]"><Sparkles size={18} /><p className="text-xs font-bold uppercase tracking-[0.2em]">Brand studio</p></div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#29211d]">Shape every customer touchpoint</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#76675f]">Organize branded invoices, portals, emails, PDFs, and signatures—and preview the experience before it goes live.</p>
          </div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={onExport} disabled={!records.length} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#e4d3c8] bg-white px-4 text-sm font-semibold text-[#66564e] hover:bg-[#fffdfb] disabled:opacity-40"><Download size={16} />Export assets</button><button type="button" onClick={onShowForm} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#d55732] px-4 text-sm font-semibold text-white hover:bg-[#bd4727]"><Paintbrush size={16} />Create asset</button></div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><BrandStudioMetric label="Brand assets" value={allRecords.length} detail="Across all channels" /><BrandStudioMetric label="Ready to use" value={ready} detail="Published identity" tone="green" /><BrandStudioMetric label="In progress" value={inProgress} detail="Still being refined" tone="orange" /><BrandStudioMetric label="Past due" value={overdue} detail="Needs attention" tone={overdue ? "red" : "neutral"} /></div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0">
          <div className="brand-asset-toolbar rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl bg-[#faf7f4] px-3 text-[#8a7b73] ring-1 ring-inset ring-[#eadfd8] focus-within:ring-[#df7352]"><Search size={16} /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search brand assets or owners" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-[#eadfd8] bg-white px-3 text-xs font-semibold text-[#71645d] outline-none"><option value="all">All stages</option><option value="working">In progress</option><option value="ready">Ready</option></select></div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{["all", ...assetTypes].map((type) => <button key={type} type="button" onClick={() => setTypeFilter(type)} className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold capitalize ${typeFilter === type ? "bg-[#29211d] text-white" : "bg-[#f6f1ed] text-[#786a62] hover:bg-[#eee6e0]"}`}><BrandAssetGlyph type={type} size={14} />{type}</button>)}</div>
          </div>

          <div className="brand-assets-grid mt-4 grid gap-4 md:grid-cols-2">
            {visibleRecords.length ? visibleRecords.map((record) => {
              const isSelected = record.id === selectedRecord?.id;
              const isReady = record.status === "done";
              return <article key={record.id} className={`brand-asset-card group cursor-pointer rounded-[1.7rem] border bg-white p-5 shadow-sm transition ${isSelected ? "border-[#d55732] ring-4 ring-[#fae9e2]" : "border-slate-200 hover:border-[#dfb7a8]"}`} onClick={() => setSelectedId(record.id)}>
                <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl text-white" style={{ backgroundColor: normalizeBrandColor(record.color) }}><BrandAssetGlyph type={record.type} size={19} /></span><div className="flex items-center gap-1"><button type="button" onClick={(event) => { event.stopPropagation(); onEdit(record); }} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Edit ${record.asset}`}><Edit3 size={14} /></button><button type="button" onClick={(event) => { event.stopPropagation(); onDelete(record.id); }} className="grid size-9 place-items-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${record.asset}`}><Trash2 size={14} /></button></div></div>
                <div className="mt-4 flex items-center gap-2"><span className="rounded-full bg-[#f5efeb] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#77665d]">{record.type || "asset"}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${isReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{isReady ? "Ready" : "In progress"}</span></div>
                <h3 className="mt-3 truncate text-lg font-semibold text-slate-950">{record.asset || "Untitled brand asset"}</h3><p className="mt-1 truncate text-xs text-slate-500">Owned by {record.owner || "Unassigned"}</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><div><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Style</p><p className="mt-1 max-w-40 truncate text-xs font-semibold text-slate-600">{record.color || "Brand default"}</p></div><button type="button" onClick={(event) => { event.stopPropagation(); onStatusChange(record.id, isReady ? "active" : "done"); }} className={`h-9 rounded-xl px-3 text-xs font-semibold ${isReady ? "border border-slate-200 text-slate-600 hover:bg-slate-50" : "bg-[#29211d] text-white hover:bg-black"}`}>{isReady ? "Revise" : "Mark ready"}</button></div>
              </article>;
            }) : <div className="col-span-full grid min-h-80 place-items-center rounded-[2rem] border border-dashed border-[#e2cfc3] bg-[#fffaf7] p-8 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#f9e8df] text-[#d55732]"><Palette size={29} /></span><p className="mt-4 font-semibold text-slate-900">Your brand canvas is empty</p><p className="mt-1 text-sm text-slate-500">Create the first customer-facing asset.</p></div></div>}
          </div>
        </div>

        <aside className="brand-preview-stage self-start overflow-hidden rounded-[2rem] bg-[#172a2b] p-4 text-white shadow-xl xl:sticky xl:top-24">
          <div className="flex items-center justify-between px-2 py-2"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#91b2ae]">Live preview</p><p className="mt-1 text-sm font-semibold text-white">Customer view</p></div><span className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-[10px] text-[#bed2cf]"><Eye size={13} />Preview mode</span></div>
          <div className="mt-3 overflow-hidden rounded-[1.5rem] bg-[#f8f5f1] text-slate-900 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-[#e8e0da] bg-white px-4 py-3"><span className="size-2 rounded-full bg-red-300" /><span className="size-2 rounded-full bg-amber-300" /><span className="size-2 rounded-full bg-emerald-300" /><div className="ml-2 h-6 flex-1 rounded-full bg-[#f3efeb]" /></div>
            <div className="p-5"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl text-white" style={{ backgroundColor: brandColor }}><BrandAssetGlyph type={selectedRecord?.type ?? "portal"} size={18} /></span><div><p className="text-sm font-bold text-[#29211d]">Your Company</p><p className="text-[10px] text-slate-400">Designed with your brand</p></div></div><span className="rounded-full px-2 py-1 text-[9px] font-bold text-white" style={{ backgroundColor: brandColor }}>LIVE</span></div>
              <div className="mt-7 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e9e1db]"><p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: brandColor }}>{selectedRecord?.type || "Brand preview"}</p><h3 className="mt-2 text-xl font-semibold text-[#29211d]">{selectedRecord?.asset || "Your branded experience"}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{selectedRecord?.notes || "Select an asset to preview its customer-facing style and presentation."}</p><div className="mt-6 h-2 overflow-hidden rounded-full bg-[#eee8e3]"><div className="h-full w-2/3 rounded-full" style={{ backgroundColor: brandColor }} /></div><div className="mt-3 h-2 w-2/5 rounded-full bg-[#eee8e3]" /><button type="button" className="mt-6 h-10 w-full rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: brandColor }}>Continue</button></div>
              <div className="mt-5 flex items-center justify-between text-[10px] text-slate-400"><span>Customer-ready layout</span><span>{selectedRecord?.color || "Default style"}</span></div></div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2"><BrandPreviewCheck label="Logo" complete={allRecords.length > 0} /><BrandPreviewCheck label="Colors" complete={Boolean(selectedRecord?.color)} /><BrandPreviewCheck label="Ready" complete={selectedRecord?.status === "done"} /></div>
        </aside>
      </section>

      {showForm ? <div className="brand-form-overlay fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="brand-form-title"><button type="button" onClick={onCloseForm} className="absolute inset-0 bg-[#172a2b]/75 backdrop-blur-sm" aria-label="Close brand asset form" /><form onSubmit={onSubmit} className="brand-asset-form relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-[#ead9cf] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d55732]">Brand workshop</p><h3 id="brand-form-title" className="mt-2 text-2xl font-semibold text-[#29211d]">{editingRecord ? "Edit brand asset" : actionLabel}</h3><p className="mt-1 text-sm text-slate-500">Define the look, owner, and delivery date for this touchpoint.</p></div><button type="button" onClick={onCloseForm} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close brand asset form"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{fields.map((field) => <div key={`${editingRecord?.id ?? "new"}-${field.name}`} className={field.type === "textarea" || field.name === "asset" ? "sm:col-span-2" : ""}><FieldInput field={field} value={editingRecord?.[field.name] ?? (field.name === "dueDate" ? getLocalTodayKey() : "")} /></div>)}<button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#d55732] px-4 text-sm font-semibold text-white hover:bg-[#bd4727] sm:col-span-2"><Paintbrush size={17} />{editingRecord ? "Save asset" : "Add to brand studio"}</button></div></form></div> : null}
    </main>
  );
}

function ApprovalDecisionDesk({
  records,
  allRecords,
  fields,
  actionLabel,
  editingRecord,
  search,
  showForm,
  onSearchChange,
  onShowForm,
  onCloseForm,
  onEdit,
  onDelete,
  onExport,
  onSubmit,
  onStatusChange,
}: {
  records: LocalRecord[];
  allRecords: LocalRecord[];
  fields: Field[];
  actionLabel: string;
  editingRecord: LocalRecord | null;
  search: string;
  showForm: boolean;
  onSearchChange: (value: string) => void;
  onShowForm: () => void;
  onCloseForm: () => void;
  onEdit: (record: LocalRecord) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [decisionFilter, setDecisionFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const types = ["expense", "invoice", "refund", "discount", "delete", "other"];
  const pendingRecords = allRecords.filter((record) => !["approved", "rejected", "done"].includes(record.status));
  const approvedRecords = allRecords.filter((record) => ["approved", "done"].includes(record.status));
  const rejectedRecords = allRecords.filter((record) => record.status === "rejected");
  const overdueRecords = pendingRecords.filter((record) => isApprovalOverdue(record.dueDate));
  const filtered = records
    .filter((record) => {
      const statusMatch = decisionFilter === "all"
        || (decisionFilter === "pending" && !["approved", "rejected", "done"].includes(record.status))
        || (decisionFilter === "approved" && ["approved", "done"].includes(record.status))
        || (decisionFilter === "rejected" && record.status === "rejected");
      return statusMatch && (typeFilter === "all" || record.type === typeFilter);
    })
    .sort(compareApprovalPriority);
  const pageSize = 9;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRecords = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="approval-desk-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="approval-command-header overflow-hidden rounded-[2rem] border border-[#d9cef8] bg-[#f5f0ff] p-6 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-end">
          <div>
            <div className="flex items-center gap-2 text-[#6941c6]"><Scale size={18} /><p className="text-xs font-bold uppercase tracking-[0.18em]">Decision room</p></div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#21163f]">Review requests with confidence</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6e6582]">See what needs approval, who requested it, and when a decision is due—without digging through a spreadsheet.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={onShowForm} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#6941c6] px-4 text-sm font-semibold text-white hover:bg-[#5633ad]"><Plus size={16} />New request</button>
              <button type="button" onClick={onExport} disabled={!records.length} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d7cbed] bg-white px-4 text-sm font-semibold text-[#594b73] hover:bg-[#fbf9ff] disabled:opacity-40"><Download size={16} />Export decisions</button>
            </div>
          </div>
          <div className="approval-scoreboard grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
            <ApprovalMetric label="Waiting" value={pendingRecords.length} icon={Inbox} tone="violet" />
            <ApprovalMetric label="Overdue" value={overdueRecords.length} icon={AlertTriangle} tone="red" />
            <ApprovalMetric label="Approved" value={approvedRecords.length} icon={ThumbsUp} tone="green" />
            <ApprovalMetric label="Declined" value={rejectedRecords.length} icon={ThumbsDown} tone="slate" />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="min-w-0">
          <div className="approval-toolbar rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl bg-slate-50 px-3 text-slate-500 ring-1 ring-inset ring-slate-200 focus-within:ring-[#8b6ed1]"><Search size={16} /><input value={search} onChange={(event) => { onSearchChange(event.target.value); setPage(1); }} placeholder="Search requests or people" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
              <select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold capitalize text-slate-600 outline-none"><option value="all">All request types</option>{types.map((type) => <option key={type} value={type}>{type}</option>)}</select>
              <div className="inline-flex overflow-x-auto rounded-xl bg-[#f2eef9] p-1">{["pending", "approved", "rejected", "all"].map((status) => <button key={status} type="button" onClick={() => { setDecisionFilter(status); setPage(1); }} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold capitalize ${decisionFilter === status ? "bg-white text-[#5e3bb1] shadow-sm" : "text-[#7b708e]"}`}>{status}</button>)}</div>
            </div>
          </div>

          <div className="approval-card-grid mt-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {visibleRecords.length ? visibleRecords.map((record) => {
              const decided = ["approved", "rejected", "done"].includes(record.status);
              const approved = ["approved", "done"].includes(record.status);
              const overdue = !decided && isApprovalOverdue(record.dueDate);
              const TypeIcon = getApprovalTypeIcon(record.type);
              return (
                <article key={record.id} className={`approval-request-card relative flex min-h-64 flex-col overflow-hidden rounded-[1.7rem] border bg-white p-5 shadow-sm ${overdue ? "border-red-200" : "border-slate-200"}`}>
                  <div className={`absolute inset-x-0 top-0 h-1 ${decided ? (approved ? "bg-emerald-400" : "bg-slate-400") : overdue ? "bg-red-400" : "bg-[#8b6ed1]"}`} />
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f1ebff] text-[#6941c6]"><TypeIcon size={19} /></span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => onEdit(record)} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Edit ${record.request}`}><Edit3 size={14} /></button>
                      <button type="button" onClick={() => onDelete(record.id)} className="grid size-9 place-items-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${record.request}`}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{record.type || "other"}</span>{overdue ? <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">Overdue</span> : null}{decided ? <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${approved ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{approved ? "Approved" : "Declined"}</span> : null}</div>
                  <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-6 text-slate-950">{record.request || "Untitled request"}</h3>
                  {record.notes ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{record.notes}</p> : null}
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5 text-xs"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Requested by</p><p className="mt-1 truncate font-semibold text-slate-700">{record.requestedBy || "Not assigned"}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Decision due</p><p className={`mt-1 truncate font-semibold ${overdue ? "text-red-600" : "text-slate-700"}`}>{formatApprovalDate(record.dueDate)}</p></div></div>
                  {!decided ? <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => onStatusChange(record.id, "rejected")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"><ThumbsDown size={14} />Decline</button><button type="button" onClick={() => onStatusChange(record.id, "approved")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#6941c6] text-xs font-semibold text-white hover:bg-[#5633ad]"><ThumbsUp size={14} />Approve</button></div> : <button type="button" onClick={() => onStatusChange(record.id, "planned")} className="mt-3 h-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Return to review</button>}
                </article>
              );
            }) : <div className="col-span-full grid min-h-80 place-items-center rounded-[2rem] border border-dashed border-[#d7cbed] bg-[#fbf9ff] p-8 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#eee7ff] text-[#6941c6]"><Inbox size={28} /></span><p className="mt-4 font-semibold text-slate-900">The decision queue is clear</p><p className="mt-1 text-sm text-slate-500">New approval requests will appear here.</p></div></div>}
          </div>
          {filtered.length > pageSize ? <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm"><p className="text-slate-500">Page {currentPage} of {pageCount}</p><div className="flex gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="grid size-9 place-items-center rounded-xl border border-slate-200 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={16} /></button><button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} className="grid size-9 place-items-center rounded-xl border border-slate-200 disabled:opacity-40" aria-label="Next page"><ChevronRight size={16} /></button></div></div> : null}
        </div>

        <aside className="approval-summary-panel self-start rounded-[2rem] bg-[#21163f] p-5 text-white shadow-lg xl:sticky xl:top-24">
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#c7b5f5]">Decision pulse</p><h3 className="mt-2 text-xl font-semibold text-white">Queue health</h3>
          <div className="mt-5 rounded-3xl bg-white/7 p-5 ring-1 ring-white/10"><div className="flex items-end justify-between"><div><p className="text-xs text-[#c9c0d8]">Awaiting review</p><p className="mt-1 text-4xl font-semibold">{pendingRecords.length}</p></div><Inbox size={28} className="text-[#ae92f1]" /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#ae92f1]" style={{ width: `${allRecords.length ? Math.max(6, (pendingRecords.length / allRecords.length) * 100) : 0}%` }} /></div></div>
          <div className="mt-4 space-y-2"><ApprovalSummaryRow label="Due or overdue" value={overdueRecords.length} alert={overdueRecords.length > 0} /><ApprovalSummaryRow label="Approved" value={approvedRecords.length} /><ApprovalSummaryRow label="Declined" value={rejectedRecords.length} /></div>
          <div className="mt-5 border-t border-white/10 pt-5"><p className="text-xs font-semibold text-white">Approver workload</p><div className="mt-3 space-y-2">{getApproverWorkload(pendingRecords).slice(0, 5).map(([name, count]) => <div key={name} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 text-xs"><span className="truncate text-[#d6cfdf]">{name}</span><span className="rounded-full bg-white/10 px-2 py-1 font-semibold text-white">{count}</span></div>)}{!pendingRecords.length ? <p className="rounded-xl bg-white/5 p-3 text-center text-xs text-[#aaa0ba]">No outstanding assignments.</p> : null}</div></div>
        </aside>
      </section>

      {showForm ? <div className="approval-form-overlay fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="approval-form-title"><button type="button" onClick={onCloseForm} className="absolute inset-0 bg-[#171022]/70 backdrop-blur-sm" aria-label="Close approval form" /><form onSubmit={onSubmit} className="approval-request-form relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-[#ddd3f2] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#6941c6]">Request intake</p><h3 id="approval-form-title" className="mt-2 text-2xl font-semibold text-[#21163f]">{editingRecord ? "Edit approval request" : actionLabel}</h3><p className="mt-1 text-sm text-slate-500">Give the approver everything needed to make a quick decision.</p></div><button type="button" onClick={onCloseForm} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close approval form"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{fields.map((field) => <div key={`${editingRecord?.id ?? "new"}-${field.name}`} className={field.type === "textarea" || field.name === "request" ? "sm:col-span-2" : ""}><FieldInput field={field} value={editingRecord?.[field.name] ?? (field.name === "dueDate" ? getLocalTodayKey() : "")} /></div>)}<button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#6941c6] px-4 text-sm font-semibold text-white hover:bg-[#5633ad] sm:col-span-2"><Scale size={17} />{editingRecord ? "Save request" : "Send for approval"}</button></div></form></div> : null}
    </main>
  );
}

function AuditTrailDashboard({
  records,
  allRecords,
  fields,
  actionLabel,
  editingRecord,
  search,
  showForm,
  onSearchChange,
  onShowForm,
  onCloseForm,
  onEdit,
  onDelete,
  onExport,
  onSubmit,
}: {
  records: LocalRecord[];
  allRecords: LocalRecord[];
  fields: Field[];
  actionLabel: string;
  editingRecord: LocalRecord | null;
  search: string;
  showForm: boolean;
  onSearchChange: (value: string) => void;
  onShowForm: () => void;
  onCloseForm: () => void;
  onEdit: (record: LocalRecord) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [areaFilter, setAreaFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [page, setPage] = useState(1);
  const areas = ["finance", "records", "settings", "permissions", "exports", "login"];
  const filtered = records.filter((record) => (areaFilter === "all" || record.area === areaFilter) && (riskFilter === "all" || record.risk === riskFilter)).sort(compareAuditDates);
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRecords = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const highRisk = allRecords.filter((record) => record.risk === "high");
  const mediumRisk = allRecords.filter((record) => record.risk === "medium").length;
  const uniqueUsers = new Set(allRecords.map((record) => record.user.trim()).filter(Boolean)).size;
  const coveredAreas = new Set(allRecords.map((record) => record.area).filter(Boolean)).size;

  return (
    <main className="audit-trail-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="dashboard-custom-hero audit-forensic-header overflow-hidden rounded-[2rem] border border-[#3c4148] bg-[#1c2025] p-6 text-white shadow-xl shadow-black/10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-[#f39797]"><Fingerprint size={18} /><p className="text-xs font-semibold uppercase tracking-[0.2em]">Workspace forensics</p></div><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Audit evidence trail</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Review who changed what, where it happened, and which events deserve immediate investigation.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={onExport} disabled={!records.length} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-40"><Download size={16} />Export evidence</button><button type="button" onClick={onShowForm} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#e15f5f] px-4 text-sm font-semibold text-white hover:bg-[#ca4d4d]"><Plus size={16} />Record event</button></div></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><AuditMetric label="Events logged" value={String(allRecords.length)} icon={History} /><AuditMetric label="High risk" value={String(highRisk.length)} icon={ShieldAlert} alert={highRisk.length > 0} /><AuditMetric label="Actors" value={String(uniqueUsers)} icon={CircleUserRound} /><AuditMetric label="Areas covered" value={String(coveredAreas)} icon={Fingerprint} /></div>
      </section>

      <section className="audit-filter-strip mt-5 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm"><div className="grid gap-3 xl:grid-cols-[1fr_auto_auto]"><label className="flex h-10 items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-500 focus-within:border-red-400 focus-within:ring-4 focus-within:ring-red-100"><Search size={16} /><input value={search} onChange={(event) => { onSearchChange(event.target.value); setPage(1); }} placeholder="Search event, user, details" className="min-w-0 flex-1 bg-transparent outline-none" /></label><select value={areaFilter} onChange={(event) => { setAreaFilter(event.target.value); setPage(1); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold capitalize text-slate-600 outline-none"><option value="all">All areas</option>{areas.map((area) => <option key={area} value={area}>{area}</option>)}</select><div className="inline-flex rounded-xl bg-slate-100 p-1">{(["all", "low", "medium", "high"] as const).map((risk) => <button key={risk} type="button" onClick={() => { setRiskFilter(risk); setPage(1); }} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${riskFilter === risk ? "bg-[#1c2025] text-white" : "text-slate-500 hover:bg-white"}`}>{risk}</button>)}</div></div></section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="audit-timeline rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">Evidence timeline</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Recorded workspace activity</h3></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">{filtered.length} event{filtered.length === 1 ? "" : "s"}</span></div>
          <div className="audit-event-stream relative mt-6 space-y-4 pl-5 sm:pl-8">{visibleRecords.length ? visibleRecords.map((record) => { const tone = getAuditRiskTone(record.risk); return <article key={record.id} className="audit-event-node relative rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><span className={`absolute -left-[1.72rem] top-6 size-3 rounded-full ring-4 ring-white sm:-left-[2.23rem] ${tone.dot}`} /><div className="grid gap-4 md:grid-cols-[110px_minmax(0,1fr)_120px_84px] md:items-center"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{formatAuditDay(record.date)}</p><p className="mt-1 text-xs font-semibold text-slate-700">{formatAuditYear(record.date)}</p></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-slate-950">{record.event || "Unnamed event"}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">{record.area || "general"}</span></div><p className="mt-1 truncate text-xs text-slate-500">Actor: {record.user || "Unknown user"}</p>{record.details ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{record.details}</p> : null}</div><span className={`w-fit rounded-xl px-2.5 py-1.5 text-xs font-semibold capitalize ${tone.badge}`}>{record.risk || "low"} risk</span><div className="flex justify-end gap-1"><button type="button" onClick={() => onEdit(record)} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Edit ${record.event}`}><Edit3 size={14} /></button><button type="button" onClick={() => onDelete(record.id)} className="grid size-9 place-items-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${record.event}`}><Trash2 size={14} /></button></div></div></article>; }) : <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><div><Fingerprint size={40} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No evidence in this view</p><p className="mt-1 text-sm text-slate-500">Record an event or change the filters.</p></div></div>}</div>
          {filtered.length > pageSize ? <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm"><p className="text-slate-500">Page {currentPage} of {pageCount}</p><div className="flex gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="h-9 rounded-xl border border-slate-200 px-3 font-semibold text-slate-600 disabled:opacity-40">Previous</button><button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} className="h-9 rounded-xl border border-slate-200 px-3 font-semibold text-slate-600 disabled:opacity-40">Next</button></div></div> : null}
        </div>

        <aside className="audit-triage-panel self-start rounded-[2rem] bg-[#1c2025] p-5 text-white shadow-lg xl:sticky xl:top-24"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f39797]">Investigation queue</p><h3 className="mt-2 text-lg font-semibold text-white">Risk triage</h3></div><ShieldAlert size={21} className="text-[#f39797]" /></div><div className="mt-5 grid grid-cols-3 gap-2"><RiskCount label="High" value={highRisk.length} tone="red" /><RiskCount label="Medium" value={mediumRisk} tone="amber" /><RiskCount label="Low" value={allRecords.length - highRisk.length - mediumRisk} tone="slate" /></div><div className="mt-5 border-t border-white/10 pt-5"><p className="text-xs font-semibold text-white">High-risk events</p><div className="mt-3 space-y-2">{highRisk.length ? highRisk.slice(0, 6).map((record) => <button key={record.id} type="button" onClick={() => { setRiskFilter("high"); onSearchChange(record.event); setPage(1); }} className="block w-full rounded-2xl bg-white/5 p-3 text-left ring-1 ring-white/10 hover:bg-white/10"><p className="truncate text-xs font-semibold text-white">{record.event}</p><p className="mt-1 truncate text-[10px] text-slate-400">{record.user || "Unknown"} · {record.area || "general"}</p></button>) : <p className="rounded-2xl bg-white/5 p-4 text-center text-xs text-slate-400 ring-1 ring-white/10">No high-risk evidence.</p>}</div></div><div className="mt-5 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"><p className="text-xs font-semibold text-white">Review guidance</p><p className="mt-2 text-[11px] leading-5 text-slate-400">Investigate permission changes, exports, and unusual login events first. Preserve details before deleting any record.</p></div></aside>
      </section>

      {showForm ? <div className="audit-form-overlay fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="audit-form-title"><button type="button" onClick={onCloseForm} className="absolute inset-0 bg-black/65 backdrop-blur-sm" aria-label="Close audit form" /><form onSubmit={onSubmit} className="audit-event-form relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">Evidence intake</p><h3 id="audit-form-title" className="mt-2 text-2xl font-semibold text-slate-950">{editingRecord ? "Edit audit event" : actionLabel}</h3></div><button type="button" onClick={onCloseForm} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close audit form"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{fields.map((field) => <div key={`${editingRecord?.id ?? "new"}-${field.name}`} className={field.type === "textarea" ? "sm:col-span-2" : ""}><FieldInput field={field} value={editingRecord?.[field.name] ?? (field.name === "date" ? getLocalTodayKey() : "")} /></div>)}<button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1c2025] px-4 text-sm font-semibold text-white hover:bg-[#30363d] sm:col-span-2">{editingRecord ? <Edit3 size={17} /> : <Fingerprint size={17} />}{editingRecord ? "Save evidence" : "Record audit event"}</button></div></form></div> : null}
    </main>
  );
}

function AutomationFlowDashboard({
  records,
  allRecords,
  fields,
  actionLabel,
  editingRecord,
  search,
  showForm,
  onSearchChange,
  onShowForm,
  onCloseForm,
  onEdit,
  onDelete,
  onExport,
  onSubmit,
  onStatusChange,
}: {
  records: LocalRecord[];
  allRecords: LocalRecord[];
  fields: Field[];
  actionLabel: string;
  editingRecord: LocalRecord | null;
  search: string;
  showForm: boolean;
  onSearchChange: (value: string) => void;
  onShowForm: () => void;
  onCloseForm: () => void;
  onEdit: (record: LocalRecord) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [triggerFilter, setTriggerFilter] = useState("all");
  const [page, setPage] = useState(1);
  const triggerTypes = ["invoice overdue", "task due", "stock low", "booking created", "document expiring"];
  const filtered = records.filter((record) => triggerFilter === "all" || record.trigger === triggerFilter);
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRecords = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const live = allRecords.filter((record) => record.status === "active").length;
  const paused = allRecords.filter((record) => record.status === "waiting").length;
  const scheduled = allRecords.filter((record) => record.nextRun).length;
  const overdueRuns = allRecords.filter((record) => record.status === "active" && isAutomationRunOverdue(record.nextRun)).length;

  return (
    <main className="automation-flow-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="dashboard-custom-hero automation-engine-header overflow-hidden rounded-[2rem] border border-[#51452f] bg-[#29251f] p-6 text-white shadow-xl shadow-amber-950/10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-[#ffc75b]"><Workflow size={18} /><p className="text-xs font-semibold uppercase tracking-[0.2em]">Workflow engine</p></div><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Automation control room</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#d6d0c5]">Connect operational events to repeatable actions, schedule the next run, and pause any workflow without deleting it.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={onExport} disabled={!records.length} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-40"><Download size={16} />Export</button><button type="button" onClick={onShowForm} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#ffc75b] px-4 text-sm font-semibold text-[#29251f] hover:bg-[#ffd77f]"><Plus size={16} />Build automation</button></div></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><AutomationMetric label="Live flows" value={String(live)} icon={Zap} /><AutomationMetric label="Paused" value={String(paused)} icon={Pause} /><AutomationMetric label="Scheduled" value={String(scheduled)} icon={CalendarClock} /><AutomationMetric label="Run overdue" value={String(overdueRuns)} icon={AlertTriangle} alert={overdueRuns > 0} /></div>
      </section>

      <section className="automation-toolbar mt-5 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="flex gap-1.5 overflow-x-auto">{["all", ...triggerTypes].map((trigger) => <button key={trigger} type="button" onClick={() => { setTriggerFilter(trigger); setPage(1); }} aria-pressed={triggerFilter === trigger} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold capitalize ${triggerFilter === trigger ? "bg-[#29251f] text-white" : "bg-slate-100 text-slate-600 hover:bg-amber-50"}`}>{trigger === "all" ? "All triggers" : trigger}</button>)}</div><label className="flex h-10 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-500 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-100 xl:max-w-xs"><Search size={16} /><input value={search} onChange={(event) => { onSearchChange(event.target.value); setPage(1); }} placeholder="Search workflows" className="min-w-0 flex-1 bg-transparent outline-none" /></label></div></section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="automation-flow-canvas rounded-[2rem] border border-slate-200 bg-[#f7f5f1] p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Flow canvas</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Event-to-action pipelines</h3></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{filtered.length} flow{filtered.length === 1 ? "" : "s"}</span></div>
          <div className="mt-5 space-y-3">{visibleRecords.length ? visibleRecords.map((record, index) => { const liveFlow = record.status === "active"; const triggerTone = getAutomationTriggerTone(record.trigger); return <article key={record.id} className="automation-pipeline group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-4"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#29251f] text-xs font-bold text-[#ffc75b]">{String((currentPage - 1) * pageSize + index + 1).padStart(2, "0")}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{record.name || "Untitled automation"}</p><p className="mt-1 truncate text-xs text-slate-400">Owner: {record.owner || "Unassigned"}</p></div></div><div className="flex gap-1"><button type="button" onClick={() => onStatusChange(record.id, liveFlow ? "waiting" : "active")} className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold ${liveFlow ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}>{liveFlow ? <Pause size={13} /> : <Play size={13} />}{liveFlow ? "Live" : "Paused"}</button><button type="button" onClick={() => onEdit(record)} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Edit ${record.name}`}><Edit3 size={14} /></button><button type="button" onClick={() => onDelete(record.id)} className="grid size-9 place-items-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${record.name}`}><Trash2 size={14} /></button></div></div>
                  <div className="grid gap-2 lg:grid-cols-[1fr_38px_1.2fr_38px_0.85fr] lg:items-center"><FlowNode icon={Zap} eyebrow="When" title={record.trigger || "Trigger not set"} tone={triggerTone} /><span className="hidden justify-self-center text-slate-300 lg:block"><ArrowRight size={18} /></span><FlowNode icon={Play} eyebrow="Then" title={record.action || "Action not set"} tone="blue" /><span className="hidden justify-self-center text-slate-300 lg:block"><ArrowRight size={18} /></span><FlowNode icon={CalendarClock} eyebrow="Next run" title={formatAutomationDate(record.nextRun)} tone={isAutomationRunOverdue(record.nextRun) ? "red" : "slate"} /></div>
                  {record.notes ? <p className="border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">{record.notes}</p> : null}
                </div></article>; }) : <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><Workflow size={40} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No automation flows here</p><p className="mt-1 text-sm text-slate-500">Build a workflow or choose another trigger.</p></div></div>}</div>
          {filtered.length > pageSize ? <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-sm"><p className="text-slate-500">Page {currentPage} of {pageCount}</p><div className="flex gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="h-9 rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-600 disabled:opacity-40">Previous</button><button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} className="h-9 rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-600 disabled:opacity-40">Next</button></div></div> : null}
        </div>

        <aside className="automation-trigger-panel self-start rounded-[2rem] bg-[#29251f] p-5 text-white shadow-lg xl:sticky xl:top-24"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ffc75b]">Trigger coverage</p><h3 className="mt-2 text-lg font-semibold text-white">Automation radar</h3></div><Zap size={21} className="text-[#ffc75b]" /></div><div className="mt-5 space-y-3">{triggerTypes.map((trigger) => { const count = allRecords.filter((record) => record.trigger === trigger).length; const width = allRecords.length ? Math.max(count ? 7 : 0, (count / allRecords.length) * 100) : 0; return <button key={trigger} type="button" onClick={() => { setTriggerFilter(trigger); setPage(1); }} className="block w-full text-left"><div className="flex items-center justify-between gap-3 text-xs"><span className="capitalize text-stone-300">{trigger}</span><span className="font-semibold text-white">{count}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#ffc75b]" style={{ width: `${width}%` }} /></div></button>; })}</div><div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"><p className="text-xs font-semibold text-white">Engine status</p><div className="mt-3 flex items-center gap-2"><span className={`size-2 rounded-full ${live ? "animate-pulse bg-emerald-400" : "bg-slate-500"}`} /><p className="text-[11px] text-stone-400">{live ? `${live} workflow${live === 1 ? "" : "s"} enabled` : "No live workflows"}</p></div></div></aside>
      </section>

      {showForm ? <div className="automation-form-overlay fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="automation-form-title"><button type="button" onClick={onCloseForm} className="absolute inset-0 bg-[#1c1914]/65 backdrop-blur-sm" aria-label="Close automation form" /><form onSubmit={onSubmit} className="automation-builder-form relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Workflow builder</p><h3 id="automation-form-title" className="mt-2 text-2xl font-semibold text-slate-950">{editingRecord ? "Edit automation" : actionLabel}</h3></div><button type="button" onClick={onCloseForm} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close automation form"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{fields.map((field) => <div key={`${editingRecord?.id ?? "new"}-${field.name}`} className={field.type === "textarea" ? "sm:col-span-2" : ""}><FieldInput field={field} value={editingRecord?.[field.name] ?? ""} /></div>)}<div className="sm:col-span-2"><FieldInput key={`${editingRecord?.id ?? "new"}-status`} field={{ name: "status", label: "Engine state", type: "select", options: statusOptions }} value={editingRecord?.status ?? "active"} /></div><button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#29251f] px-4 text-sm font-semibold text-white hover:bg-[#3b352c] sm:col-span-2">{editingRecord ? <Edit3 size={17} /> : <Zap size={17} />}{editingRecord ? "Save workflow" : "Activate automation"}</button></div></form></div> : null}
    </main>
  );
}

function BranchAnalyticsDashboard({
  records,
  allRecords,
  fields,
  actionLabel,
  editingRecord,
  search,
  showForm,
  onSearchChange,
  onShowForm,
  onCloseForm,
  onEdit,
  onDelete,
  onExport,
  onSubmit,
}: {
  records: LocalRecord[];
  allRecords: LocalRecord[];
  fields: Field[];
  actionLabel: string;
  editingRecord: LocalRecord | null;
  search: string;
  showForm: boolean;
  onSearchChange: (value: string) => void;
  onShowForm: () => void;
  onCloseForm: () => void;
  onEdit: (record: LocalRecord) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [page, setPage] = useState(1);
  const currency = readLocalCurrency();
  const totalRevenue = allRecords.reduce((sum, record) => sum + Number(record.revenue || 0), 0);
  const totalExpenses = allRecords.reduce((sum, record) => sum + Number(record.expenses || 0), 0);
  const totalBookings = allRecords.reduce((sum, record) => sum + Number(record.bookings || 0), 0);
  const profit = totalRevenue - totalExpenses;
  const margin = totalRevenue ? Math.round((profit / totalRevenue) * 100) : 0;
  const branchPerformance = groupBranchPerformance(allRecords);
  const maxTurnover = Math.max(1, ...branchPerformance.map((branch) => Math.max(branch.revenue, branch.expenses)));
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="branch-analytics-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="dashboard-custom-hero analytics-command-header overflow-hidden rounded-[2rem] border border-[#b9c5ff] bg-[#edf0ff] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-[#3d4dc7]"><BarChart3 size={17} /><p className="text-xs font-semibold uppercase tracking-[0.19em]">Performance intelligence</p></div><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Branch command report</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Compare branch revenue, costs, profit, and bookings from one executive scorecard.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={onExport} disabled={!records.length} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#c9cff5] bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-[#f8f9ff] disabled:opacity-40"><Download size={16} />Export</button><button type="button" onClick={onShowForm} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#3949bd] px-4 text-sm font-semibold text-white hover:bg-[#2f3da2]"><Plus size={16} />Add snapshot</button></div></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><AnalyticsMetric label="Revenue" value={formatCurrencyAmount(totalRevenue, currency)} icon={TrendingUp} tone="blue" /><AnalyticsMetric label="Expenses" value={formatCurrencyAmount(totalExpenses, currency)} icon={Landmark} tone="red" /><AnalyticsMetric label="Net profit" value={formatCurrencyAmount(profit, currency)} icon={Activity} tone={profit < 0 ? "red" : "green"} /><AnalyticsMetric label="Profit margin" value={`${margin}%`} icon={Percent} tone={margin < 0 ? "red" : "violet"} /></div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="analytics-comparison rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3949bd]">Branch comparison</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Revenue versus expenses</h3></div><div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#4f63e9]" />Revenue</span><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#f08a7d]" />Expenses</span></div></div>
          <div className="mt-6 space-y-5">{branchPerformance.length ? branchPerformance.slice(0, 10).map((branch, index) => <div key={branch.name} className="analytics-branch-bar grid gap-3 md:grid-cols-[42px_150px_minmax(0,1fr)_110px] md:items-center"><span className="grid size-9 place-items-center rounded-xl bg-[#edf0ff] text-xs font-bold text-[#3949bd]">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{branch.name}</p><p className="mt-1 text-[10px] text-slate-400">{branch.bookings} bookings · {branch.snapshots} period{branch.snapshots === 1 ? "" : "s"}</p></div><div className="space-y-2"><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#4f63e9]" style={{ width: `${(branch.revenue / maxTurnover) * 100}%` }} /></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#f08a7d]" style={{ width: `${(branch.expenses / maxTurnover) * 100}%` }} /></div></div><div className="md:text-right"><p className={`text-sm font-semibold ${branch.profit < 0 ? "text-red-600" : "text-emerald-700"}`}>{formatCurrencyAmount(branch.profit, currency)}</p><p className="mt-1 text-[10px] text-slate-400">net profit</p></div></div>) : <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-300 p-8 text-center"><div><BarChart3 size={38} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No performance data yet</p><p className="mt-1 text-sm text-slate-500">Add a branch snapshot to build this comparison.</p></div></div>}</div>
        </div>

        <aside className="analytics-leaderboard self-start rounded-[2rem] bg-[#171b38] p-5 text-white shadow-lg xl:sticky xl:top-24"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#aeb8ff]">Profit ranking</p><h3 className="mt-2 text-lg font-semibold text-white">Branch leaderboard</h3></div><TrendingUp size={21} className="text-[#aeb8ff]" /></div><div className="mt-5 space-y-2">{branchPerformance.length ? [...branchPerformance].sort((first, second) => second.profit - first.profit).slice(0, 7).map((branch, index) => <div key={branch.name} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10"><span className={`grid size-8 shrink-0 place-items-center rounded-xl text-xs font-bold ${index === 0 ? "bg-amber-300 text-slate-900" : "bg-white/10 text-white"}`}>{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{branch.name}</p><p className="mt-1 text-[10px] text-slate-400">{branch.margin}% margin</p></div><p className={`text-xs font-semibold ${branch.profit < 0 ? "text-red-300" : "text-emerald-300"}`}>{formatCurrencyAmount(branch.profit, currency)}</p></div>) : <p className="py-8 text-center text-sm text-slate-400">Rankings appear after snapshots are added.</p>}</div><div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs text-slate-400">Total bookings</p><p className="mt-1 text-2xl font-semibold text-white">{totalBookings}</p></div></aside>
      </section>

      <section className="analytics-snapshot-explorer mt-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3949bd]">Snapshot explorer</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Reported periods</h3></div><label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-500 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 sm:max-w-xs"><Search size={17} /><input value={search} onChange={(event) => { onSearchChange(event.target.value); setPage(1); }} placeholder="Search branch or period" className="min-w-0 flex-1 bg-transparent outline-none" /></label></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visibleRecords.map((record) => { const recordProfit = Number(record.revenue || 0) - Number(record.expenses || 0); return <article key={record.id} className="analytics-snapshot-card rounded-3xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{record.branch || "Unnamed branch"}</p><p className="mt-1 text-xs text-slate-400">{record.period || "Period not set"}</p></div><span className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold ${recordProfit < 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{formatCurrencyAmount(recordProfit, currency)}</span></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><SnapshotValue label="Revenue" value={formatCurrencyAmount(Number(record.revenue || 0), currency)} /><SnapshotValue label="Expense" value={formatCurrencyAmount(Number(record.expenses || 0), currency)} /><SnapshotValue label="Bookings" value={record.bookings || "0"} /></div><div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-3"><button type="button" onClick={() => onEdit(record)} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Edit ${record.branch}`}><Edit3 size={15} /></button><button type="button" onClick={() => onDelete(record.id)} className="grid size-9 place-items-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${record.branch}`}><Trash2 size={15} /></button></div></article>; })}</div>{!visibleRecords.length ? <p className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No snapshots match this search.</p> : null}{records.length ? <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm"><p className="text-slate-500">Page {currentPage} of {pageCount}</p><div className="flex gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="h-9 rounded-xl border border-slate-200 px-3 font-semibold text-slate-600 disabled:opacity-40">Previous</button><button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} className="h-9 rounded-xl border border-slate-200 px-3 font-semibold text-slate-600 disabled:opacity-40">Next</button></div></div> : null}</section>

      {showForm ? <div className="analytics-form-overlay fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="analytics-form-title"><button type="button" onClick={onCloseForm} className="absolute inset-0 bg-[#11152d]/65 backdrop-blur-sm" aria-label="Close snapshot form" /><form onSubmit={onSubmit} className="analytics-snapshot-form relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3949bd]">Performance snapshot</p><h3 id="analytics-form-title" className="mt-2 text-2xl font-semibold text-slate-950">{editingRecord ? "Edit branch snapshot" : actionLabel}</h3></div><button type="button" onClick={onCloseForm} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close snapshot form"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{fields.map((field) => <div key={`${editingRecord?.id ?? "new"}-${field.name}`} className={field.type === "textarea" ? "sm:col-span-2" : ""}><FieldInput field={field} value={editingRecord?.[field.name] ?? ""} /></div>)}<button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#3949bd] px-4 text-sm font-semibold text-white hover:bg-[#2f3da2] sm:col-span-2">{editingRecord ? <Edit3 size={17} /> : <Plus size={17} />}{editingRecord ? "Save snapshot" : actionLabel}</button></div></form></div> : null}
    </main>
  );
}

function PortalExperienceDashboard({
  records,
  allRecords,
  fields,
  actionLabel,
  editingRecord,
  search,
  showForm,
  onSearchChange,
  onShowForm,
  onCloseForm,
  onEdit,
  onDelete,
  onExport,
  onSubmit,
  onStatusChange,
}: {
  records: LocalRecord[];
  allRecords: LocalRecord[];
  fields: Field[];
  actionLabel: string;
  editingRecord: LocalRecord | null;
  search: string;
  showForm: boolean;
  onSearchChange: (value: string) => void;
  onShowForm: () => void;
  onCloseForm: () => void;
  onEdit: (record: LocalRecord) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const portalTypes = ["invoice view", "document request", "booking view", "message", "payment link"];
  const visibleRecords = records.filter((record) => typeFilter === "all" || record.type === typeFilter);
  const selected = visibleRecords.find((record) => record.id === selectedId) ?? visibleRecords[0] ?? null;
  const customers = new Set(allRecords.map((record) => record.customer.trim()).filter(Boolean)).size;
  const ready = allRecords.filter((record) => record.status === "done").length;
  const attention = allRecords.filter((record) => record.status !== "done" && isPortalDueSoon(record.dueDate)).length;

  return (
    <main className="portal-experience-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="dashboard-custom-hero portal-studio-header overflow-hidden rounded-[2rem] border border-[#efc9bc] bg-[#fff5ee] p-6 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-center">
          <div><div className="flex items-center gap-2 text-[#b64d35]"><MonitorSmartphone size={17} /><p className="text-xs font-semibold uppercase tracking-[0.19em]">Client experience studio</p></div><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Customer portal</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Prepare what each customer can see, request, pay, or book—then review the experience in the live portal preview.</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={onShowForm} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#b64d35] px-4 text-sm font-semibold text-white hover:bg-[#9d3f2b]"><Plus size={16} />Add portal content</button><button type="button" onClick={onExport} disabled={!records.length} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#e7c3b7] bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-[#fffaf7] disabled:opacity-40"><Download size={16} />Export</button></div></div>
          <div className="portal-readiness-card rounded-3xl bg-[#2d2238] p-5 text-white"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f3b6a5]">Portal readiness</p><p className="mt-2 text-3xl font-semibold text-white">{allRecords.length ? Math.round((ready / allRecords.length) * 100) : 0}%</p></div><span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-[#f3b6a5]"><Eye size={21} /></span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#f08a6f]" style={{ width: `${allRecords.length ? (ready / allRecords.length) * 100 : 0}%` }} /></div><p className="mt-3 text-xs leading-5 text-[#cec5d5]">{ready} of {allRecords.length} portal item{allRecords.length === 1 ? "" : "s"} ready for customers.</p></div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3"><PortalMetric label="Customers" value={String(customers)} icon={CircleUserRound} /><PortalMetric label="Visible items" value={String(allRecords.length)} icon={Eye} /><PortalMetric label="Needs attention" value={String(attention)} icon={Bell} alert={attention > 0} /></div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="portal-control-panel rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b64d35]">Portal controls</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Client-facing content</h3></div><label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-500 focus-within:border-[#d36d53] focus-within:ring-4 focus-within:ring-orange-100 lg:max-w-xs"><Search size={17} /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search customer or item" className="min-w-0 flex-1 bg-transparent outline-none" /></label></div>
          <div className="mt-4 flex gap-1.5 overflow-x-auto rounded-2xl bg-[#fff7f2] p-2">{["all", ...portalTypes].map((type) => <button key={type} type="button" onClick={() => setTypeFilter(type)} aria-pressed={typeFilter === type} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold capitalize ${typeFilter === type ? "bg-[#2d2238] text-white" : "bg-white text-slate-600 hover:bg-orange-50"}`}>{type === "all" ? "Everything" : type}</button>)}</div>

          <div className="mt-5 space-y-2">
            {visibleRecords.length ? visibleRecords.map((record) => {
              const TypeIcon = getPortalTypeIcon(record.type);
              const selectedRow = selected?.id === record.id;
              return <article key={record.id} className={`portal-content-row group grid cursor-pointer gap-3 rounded-2xl border p-4 transition md:grid-cols-[46px_minmax(170px,1fr)_130px_116px_78px] md:items-center ${selectedRow ? "border-[#e6a28f] bg-[#fff8f4] shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`} onClick={() => setSelectedId(record.id)}><span className={`grid size-11 place-items-center rounded-2xl ${selectedRow ? "bg-[#f7d8ce] text-[#a8432c]" : "bg-slate-100 text-slate-600"}`}><TypeIcon size={18} /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{record.portalItem || "Untitled portal item"}</p><p className="mt-1 truncate text-xs text-slate-500">{record.customer || "Customer not set"} · {record.assignedTo || "No owner"}</p></div><span className="w-fit rounded-full bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold capitalize text-slate-600">{record.type || "general"}</span><select value={record.status} onClick={(event) => event.stopPropagation()} onChange={(event) => onStatusChange(record.id, event.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold capitalize text-slate-600 outline-none"><option value="planned">Draft</option><option value="active">Published</option><option value="waiting">Waiting</option><option value="done">Complete</option></select><div className="flex justify-end gap-1"><button type="button" onClick={(event) => { event.stopPropagation(); onEdit(record); }} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-white hover:text-slate-700" aria-label={`Edit ${record.portalItem}`}><Edit3 size={15} /></button><button type="button" onClick={(event) => { event.stopPropagation(); onDelete(record.id); }} className="grid size-9 place-items-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${record.portalItem}`}><Trash2 size={15} /></button></div></article>;
            }) : <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-300 p-8 text-center"><div><MonitorSmartphone size={38} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No portal content here</p><p className="mt-1 text-sm text-slate-500">Add an item or choose another content type.</p></div></div>}
          </div>
        </div>

        <aside className="portal-client-preview self-start overflow-hidden rounded-[2rem] border-[8px] border-[#2d2238] bg-white shadow-xl xl:sticky xl:top-24">
          <div className="flex items-center justify-between bg-[#2d2238] px-4 pb-3 text-white"><div className="flex gap-1.5"><span className="size-2 rounded-full bg-[#f08a6f]" /><span className="size-2 rounded-full bg-[#f5c86c]" /><span className="size-2 rounded-full bg-[#7dd3b0]" /></div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#cec5d5]">Live preview</p><MonitorSmartphone size={14} className="text-[#f3b6a5]" /></div>
          {selected ? <div className="min-h-[31rem] bg-[#fffaf7]"><div className="bg-[#fff0e8] p-5"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#b64d35] text-sm font-bold text-white">{getPortalInitials(selected.customer)}</span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider text-[#b64d35]">Customer portal</p><h3 className="mt-1 truncate text-lg font-semibold text-slate-950">Welcome, {selected.customer || "Customer"}</h3></div></div></div><div className="p-5"><div className="rounded-3xl border border-[#f0d9cf] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#fff0e8] text-[#b64d35]">{(() => { const Icon = getPortalTypeIcon(selected.type); return <Icon size={19} />; })()}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${selected.status === "done" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{getPortalStatusLabel(selected.status)}</span></div><p className="mt-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{selected.type || "Portal item"}</p><h4 className="mt-2 text-xl font-semibold text-slate-950">{selected.portalItem || "Untitled item"}</h4><p className="mt-3 text-sm leading-6 text-slate-500">{selected.notes || "This item is ready to be shared with the customer once its portal status is published."}</p>{selected.dueDate ? <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600"><CalendarDays size={14} />Due {formatPortalDate(selected.dueDate)}</div> : null}<button type="button" className="mt-5 h-11 w-full rounded-xl bg-[#2d2238] text-sm font-semibold text-white">{getPortalActionLabel(selected.type)}</button></div><div className="mt-4 grid grid-cols-3 gap-2"><PreviewShortcut icon={ReceiptText} label="Invoices" /><PreviewShortcut icon={CalendarDays} label="Bookings" /><PreviewShortcut icon={MessageCircle} label="Messages" /></div></div></div> : <div className="grid min-h-[31rem] place-items-center bg-[#fffaf7] p-8 text-center"><div><CircleUserRound size={42} className="mx-auto text-[#e6cfc5]" /><p className="mt-3 font-semibold text-slate-700">Select portal content</p><p className="mt-1 text-sm text-slate-500">The customer preview will appear here.</p></div></div>}
        </aside>
      </section>

      {showForm ? <div className="portal-form-overlay fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="portal-form-title"><button type="button" onClick={onCloseForm} className="absolute inset-0 bg-[#201729]/60 backdrop-blur-sm" aria-label="Close portal form" /><form onSubmit={onSubmit} className="portal-item-form relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b64d35]">Portal content</p><h3 id="portal-form-title" className="mt-2 text-2xl font-semibold text-slate-950">{editingRecord ? "Edit portal item" : actionLabel}</h3></div><button type="button" onClick={onCloseForm} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close portal form"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{fields.map((field) => <div key={`${editingRecord?.id ?? "new"}-${field.name}`} className={field.type === "textarea" ? "sm:col-span-2" : ""}><FieldInput field={field} value={editingRecord?.[field.name] ?? ""} /></div>)}<div className="sm:col-span-2"><FieldInput key={`${editingRecord?.id ?? "new"}-status`} field={{ name: "status", label: "Portal status", type: "select", options: statusOptions }} value={editingRecord?.status ?? "planned"} /></div><button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#b64d35] px-4 text-sm font-semibold text-white hover:bg-[#9d3f2b] sm:col-span-2">{editingRecord ? <Edit3 size={17} /> : <Plus size={17} />}{editingRecord ? "Save changes" : actionLabel}</button></div></form></div> : null}
    </main>
  );
}

function ProcurementDashboard({
  records,
  allRecords,
  fields,
  actionLabel,
  editingRecord,
  search,
  showForm,
  onSearchChange,
  onShowForm,
  onCloseForm,
  onEdit,
  onDelete,
  onExport,
  onSubmit,
  onStatusChange,
}: {
  records: LocalRecord[];
  allRecords: LocalRecord[];
  fields: Field[];
  actionLabel: string;
  editingRecord: LocalRecord | null;
  search: string;
  showForm: boolean;
  onSearchChange: (value: string) => void;
  onShowForm: () => void;
  onCloseForm: () => void;
  onEdit: (record: LocalRecord) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [stage, setStage] = useState("all");
  const currency = readLocalCurrency();
  const visibleRecords = records.filter((record) => stage === "all" || record.status === stage).sort(compareOrderDelivery);
  const totalValue = allRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const dueSoon = allRecords.filter((record) => isDeliverySoon(record.expectedDate) && record.status !== "done").length;
  const supplierGroups = groupPurchaseOrdersBySupplier(allRecords);

  return (
    <main className="procurement-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="dashboard-custom-hero procurement-blueprint-header overflow-hidden rounded-[2rem] border border-[#274685] bg-[#102a5e] p-6 text-white shadow-xl shadow-blue-950/10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#83c8ff]">Procurement blueprint</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Purchase order control</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/75">Move supplier orders from request to delivery while keeping value, branch, and arrival dates visible.</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={onExport} disabled={!records.length} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-40"><Download size={16} />Export</button><button type="button" onClick={onShowForm} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#fbbf24] px-4 text-sm font-semibold text-[#172554] hover:bg-[#fcd34d]"><Plus size={16} />New order</button></div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ProcurementMetric label="Order value" value={formatCurrencyAmount(totalValue, currency)} icon={Boxes} />
          <ProcurementMetric label="Open orders" value={String(allRecords.filter((record) => record.status !== "done").length)} icon={Route} />
          <ProcurementMetric label="Due soon" value={String(dueSoon)} icon={Truck} alert={dueSoon > 0} />
          <ProcurementMetric label="Suppliers" value={String(supplierGroups.length)} icon={Factory} />
        </div>
      </section>

      <section className="procurement-stage-rail mt-5 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-5">
          {[{ key: "all", label: "All orders", icon: Boxes }, { key: "planned", label: "Requested", icon: Route }, { key: "active", label: "Approved", icon: CheckCircle2 }, { key: "waiting", label: "In transit", icon: Truck }, { key: "done", label: "Delivered", icon: PackageCheck }].map(({ key, label, icon: Icon }) => {
            const count = key === "all" ? allRecords.length : allRecords.filter((record) => record.status === key).length;
            return <button key={key} type="button" onClick={() => setStage(key)} aria-pressed={stage === key} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${stage === key ? "bg-[#102a5e] text-white shadow-md" : "bg-slate-50 text-slate-600 hover:bg-blue-50"}`}><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${stage === key ? "bg-white/10 text-[#fbbf24]" : "bg-white text-blue-700 shadow-sm"}`}><Icon size={16} /></span><span className="min-w-0"><span className="block truncate text-xs font-semibold">{label}</span><span className={`mt-0.5 block text-[10px] ${stage === key ? "text-blue-200" : "text-slate-400"}`}>{count} order{count === 1 ? "" : "s"}</span></span></button>;
          })}
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="procurement-manifest overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Delivery manifest</p><h3 className="mt-1 font-semibold text-slate-950">Orders on the move</h3></div><label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-500 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 sm:max-w-xs"><Search size={17} /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search orders" className="min-w-0 flex-1 bg-transparent outline-none" /></label></div>
          <div className="divide-y divide-slate-100">
            {visibleRecords.length ? visibleRecords.map((record) => {
              const tone = getProcurementStatusTone(record.status);
              return <article key={record.id} className="procurement-order-row group grid gap-4 bg-white px-5 py-4 md:grid-cols-[minmax(190px,1.2fr)_120px_120px_120px_126px_76px] md:items-center"><div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Building2 size={18} /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{record.item || "Untitled order"}</p><p className="mt-1 truncate text-xs text-slate-500">{record.supplier || "Supplier not set"}</p></div></div><span className="truncate text-xs font-medium text-slate-600">{record.branch || "No branch"}</span><p className="text-sm font-semibold text-slate-950">{formatCurrencyAmount(Number(record.amount || 0), currency)}</p><div><p className="text-xs font-semibold text-slate-700">{formatProcurementDate(record.expectedDate)}</p>{isDeliverySoon(record.expectedDate) && record.status !== "done" ? <p className="mt-1 text-[10px] font-semibold text-amber-600">Arriving soon</p> : null}</div><select value={record.status} onChange={(event) => onStatusChange(record.id, event.target.value)} className={`h-9 rounded-xl border-0 px-2 text-xs font-semibold capitalize outline-none ring-1 ring-inset ${tone}`} aria-label={`Status for ${record.item}`}><option value="planned">Requested</option><option value="active">Approved</option><option value="waiting">In transit</option><option value="done">Delivered</option></select><div className="flex justify-end gap-1"><button type="button" onClick={() => onEdit(record)} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Edit ${record.item}`}><Edit3 size={15} /></button><button type="button" onClick={() => onDelete(record.id)} className="grid size-9 place-items-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${record.item}`}><Trash2 size={15} /></button></div></article>;
            }) : <div className="grid min-h-72 place-items-center p-8 text-center"><div><Truck size={36} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No orders in this stage</p><p className="mt-1 text-sm text-slate-500">Create an order or select another workflow stage.</p></div></div>}
          </div>
        </div>

        <aside className="procurement-suppliers self-start rounded-[2rem] border border-[#d8e0ee] bg-[#f3f6fb] p-5 shadow-sm xl:sticky xl:top-24"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Supplier lanes</p><h3 className="mt-2 text-lg font-semibold text-slate-950">Order concentration</h3></div><Factory size={21} className="text-blue-700" /></div><div className="mt-5 space-y-3">{supplierGroups.length ? supplierGroups.slice(0, 7).map(([supplier, supplierRecords]) => { const value = supplierRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0); const width = totalValue ? Math.max(4, (value / totalValue) * 100) : 0; return <div key={supplier} className="rounded-2xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{supplier}</p><p className="mt-1 text-[10px] text-slate-400">{supplierRecords.length} order{supplierRecords.length === 1 ? "" : "s"}</p></div><p className="text-xs font-semibold text-slate-700">{formatCurrencyAmount(value, currency)}</p></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${width}%` }} /></div></div>; }) : <p className="py-8 text-center text-sm text-slate-400">No suppliers yet.</p>}</div></aside>
      </section>

      {showForm ? <div className="procurement-form-overlay fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="procurement-form-title"><button type="button" onClick={onCloseForm} className="absolute inset-0 bg-[#081a3d]/60 backdrop-blur-sm" aria-label="Close purchase order form" /><form onSubmit={onSubmit} className="procurement-form relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Purchase request</p><h3 id="procurement-form-title" className="mt-2 text-2xl font-semibold text-slate-950">{editingRecord ? "Edit purchase order" : actionLabel}</h3></div><button type="button" onClick={onCloseForm} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close form"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{fields.map((field) => <div key={`${editingRecord?.id ?? "new"}-${field.name}`} className={field.type === "textarea" ? "sm:col-span-2" : ""}><FieldInput field={field} value={editingRecord?.[field.name] ?? ""} /></div>)}<div className="sm:col-span-2"><FieldInput key={`${editingRecord?.id ?? "new"}-status`} field={{ name: "status", label: "Procurement stage", type: "select", options: statusOptions }} value={editingRecord?.status ?? "planned"} /></div><button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#102a5e] px-4 text-sm font-semibold text-white hover:bg-[#183b7a] sm:col-span-2">{editingRecord ? <Edit3 size={17} /> : <Plus size={17} />}{editingRecord ? "Save changes" : actionLabel}</button></div></form></div> : null}
    </main>
  );
}

function AttendanceDashboard({
  records,
  allRecords,
  fields,
  actionLabel,
  editingRecord,
  search,
  selectedDate,
  showForm,
  onSearchChange,
  onDateChange,
  onShowForm,
  onCloseForm,
  onEdit,
  onDelete,
  onExport,
  onSubmit,
}: {
  records: LocalRecord[];
  allRecords: LocalRecord[];
  fields: Field[];
  actionLabel: string;
  editingRecord: LocalRecord | null;
  search: string;
  selectedDate: string;
  showForm: boolean;
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onShowForm: () => void;
  onCloseForm: () => void;
  onEdit: (record: LocalRecord) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const dayRecords = records.filter((record) => record.date === selectedDate);
  const present = dayRecords.filter((record) => ["check-in", "overtime"].includes(record.recordType)).length;
  const late = dayRecords.filter((record) => record.recordType === "late").length;
  const absent = dayRecords.filter((record) => record.recordType === "absence").length;
  const timeOff = dayRecords.filter((record) => record.recordType === "time-off").length;
  const hours = dayRecords.reduce((total, record) => total + Number(record.hours || 0), 0);
  const exceptions = dayRecords.filter((record) => ["late", "absence", "time-off"].includes(record.recordType));
  const attendanceRate = dayRecords.length ? Math.round((present / dayRecords.length) * 100) : 0;

  return (
    <main className="attendance-day-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="dashboard-custom-hero attendance-clock-header overflow-hidden rounded-[2rem] border border-[#174d55] bg-[#083b43] p-6 text-white shadow-xl shadow-[#083b43]/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#73e6d3]">Workforce clock</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Daily attendance</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b8d9da]">Review who is present, spot exceptions, and keep working-hour records clear.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onExport} disabled={!records.length} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-40"><Download size={16} />Export</button>
            <button type="button" onClick={onShowForm} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#65e6cf] px-4 text-sm font-semibold text-[#07383f] hover:bg-[#81f0dc]"><Plus size={16} />Add record</button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <AttendanceMetric label="Present" value={String(present)} icon={UserCheck} />
          <AttendanceMetric label="Late" value={String(late)} icon={Clock3} alert={late > 0} />
          <AttendanceMetric label="Absent" value={String(absent)} icon={TimerOff} alert={absent > 0} />
          <AttendanceMetric label="Time off" value={String(timeOff)} icon={CalendarDays} />
          <AttendanceMetric label="Hours" value={hours.toFixed(hours % 1 ? 1 : 0)} icon={Clock3} />
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="attendance-sheet rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onDateChange(shiftDateKey(selectedDate, -1))} className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Previous day"><ChevronLeft size={17} /></button>
              <button type="button" onClick={() => onDateChange(getLocalTodayKey())} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50">Today</button>
              <button type="button" onClick={() => onDateChange(shiftDateKey(selectedDate, 1))} className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Next day"><ChevronRight size={17} /></button>
              <div className="ml-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Day sheet</p>
                <p className="mt-0.5 font-semibold text-slate-900">{formatAttendanceDate(selectedDate)}</p>
              </div>
            </div>
            <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-500 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-100 lg:max-w-xs">
              <Search size={17} />
              <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search employees" className="min-w-0 flex-1 bg-transparent outline-none" />
            </label>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="hidden grid-cols-[minmax(180px,1.3fr)_140px_1fr_100px_110px] gap-4 bg-slate-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:grid">
              <span>Employee</span><span>Attendance</span><span>Hours</span><span>Manager</span><span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
              {dayRecords.length ? dayRecords.map((record) => {
                const tone = getAttendanceTone(record.recordType);
                const Icon = tone.icon;
                const recordHours = Number(record.hours || 0);
                return (
                  <article key={record.id} className="attendance-row grid gap-3 bg-white p-4 md:grid-cols-[minmax(180px,1.3fr)_140px_1fr_100px_110px] md:items-center md:gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-slate-100 text-xs font-bold text-slate-700">{getAttendanceInitials(record.employee)}</span>
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{record.employee || "Unnamed employee"}</p><p className="mt-0.5 truncate text-xs text-slate-400">{record.notes || "No attendance note"}</p></div>
                    </div>
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold capitalize ${tone.className}`}><Icon size={13} />{record.recordType || "unknown"}</span>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-700">{recordHours || 0}h</span><span className="text-slate-400">of 8h</span></div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#23b9a5]" style={{ width: `${Math.min(100, (recordHours / 8) * 100)}%` }} /></div>
                    </div>
                    <p className="truncate text-sm text-slate-600">{record.manager || "—"}</p>
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => onEdit(record)} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Edit ${record.employee}`}><Edit3 size={15} /></button>
                      <button type="button" onClick={() => onDelete(record.id)} className="grid size-9 place-items-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${record.employee}`}><Trash2 size={15} /></button>
                    </div>
                  </article>
                );
              }) : (
                <div className="grid min-h-64 place-items-center p-8 text-center"><div><UserCheck className="mx-auto text-slate-300" size={36} /><p className="mt-3 font-semibold text-slate-800">No records for this day</p><p className="mt-1 text-sm text-slate-500">Add an attendance record or choose another date.</p></div></div>
              )}
            </div>
          </div>
        </div>

        <aside className="attendance-insights self-start rounded-[2rem] border border-[#dbe9e7] bg-[#f3faf8] p-5 shadow-sm xl:sticky xl:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#168878]">Daily signal</p>
          <div className="mt-5 flex items-center gap-4">
            <div className="grid size-20 shrink-0 place-items-center rounded-full bg-white text-xl font-semibold text-[#083b43] shadow-sm ring-8 ring-[#d9f4ee]">{attendanceRate}%</div>
            <div><p className="font-semibold text-slate-900">Attendance rate</p><p className="mt-1 text-sm leading-5 text-slate-500">Based on {dayRecords.length} record{dayRecords.length === 1 ? "" : "s"} today</p></div>
          </div>
          <div className="mt-6 rounded-2xl border border-[#dbe9e7] bg-white p-4">
            <div className="flex items-center justify-between"><p className="font-semibold text-slate-900">Exceptions</p><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{exceptions.length}</span></div>
            <div className="mt-4 space-y-3">
              {exceptions.length ? exceptions.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-start gap-3"><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><AlertTriangle size={14} /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{record.employee}</p><p className="mt-0.5 text-xs capitalize text-slate-500">{record.recordType}{record.hours ? ` · ${record.hours}h` : ""}</p></div></div>
              )) : <p className="py-4 text-center text-sm text-slate-400">No exceptions recorded.</p>}
            </div>
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">{allRecords.length} total record{allRecords.length === 1 ? "" : "s"} saved in this workspace browser.</p>
        </aside>
      </section>

      {showForm ? (
        <div className="attendance-form-overlay fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="attendance-form-title">
          <button type="button" onClick={onCloseForm} className="absolute inset-0 bg-[#062f35]/55 backdrop-blur-sm" aria-label="Close attendance form" />
          <form onSubmit={onSubmit} className="attendance-form relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Attendance entry</p><h3 id="attendance-form-title" className="mt-2 text-2xl font-semibold text-slate-950">{editingRecord ? "Edit attendance" : actionLabel}</h3></div><button type="button" onClick={onCloseForm} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close attendance form"><X size={18} /></button></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {fields.map((field) => <div key={`${editingRecord?.id ?? "new"}-${field.name}`} className={field.type === "textarea" ? "sm:col-span-2" : ""}><FieldInput field={field} value={editingRecord?.[field.name] ?? (field.name === "date" ? selectedDate : "")} /></div>)}
              <div className="sm:col-span-2"><FieldInput key={`${editingRecord?.id ?? "new"}-status`} field={{ name: "status", label: "Workflow status", type: "select", options: statusOptions }} value={editingRecord?.status ?? "planned"} /></div>
              <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0c8b7a] px-4 text-sm font-semibold text-white hover:bg-[#087567] sm:col-span-2">{editingRecord ? <Edit3 size={17} /> : <Plus size={17} />}{editingRecord ? "Save changes" : actionLabel}</button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function AttendanceMetric({ label, value, icon: Icon, alert = false }: { label: string; value: string; icon: typeof Clock3; alert?: boolean }) {
  return <div className={`rounded-2xl border px-4 py-3 ${alert ? "border-amber-300/30 bg-amber-300/10" : "border-white/10 bg-white/[0.06]"}`}><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-[#b8d9da]">{label}</p><Icon size={15} className={alert ? "text-amber-200" : "text-[#73e6d3]"} /></div><p className={`mt-2 text-xl font-semibold ${alert ? "text-amber-100" : "text-white"}`}>{value}</p></div>;
}

function ProcurementMetric({ label, value, icon: Icon, alert = false }: { label: string; value: string; icon: typeof Boxes; alert?: boolean }) {
  return <div className={`rounded-2xl border px-4 py-3 ${alert ? "border-amber-300/30 bg-amber-300/10" : "border-white/10 bg-white/[0.06]"}`}><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">{label}</p><Icon size={15} className={alert ? "text-amber-300" : "text-[#83c8ff]"} /></div><p className={`mt-2 truncate text-xl font-semibold ${alert ? "text-amber-100" : "text-white"}`}>{value}</p></div>;
}

function PortalMetric({ label, value, icon: Icon, alert = false }: { label: string; value: string; icon: typeof Eye; alert?: boolean }) {
  return <div className={`rounded-2xl border px-4 py-3 ${alert ? "border-amber-200 bg-amber-50" : "border-[#efd8cf] bg-white/70"}`}><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p><Icon size={15} className={alert ? "text-amber-600" : "text-[#b64d35]"} /></div><p className={`mt-2 text-xl font-semibold ${alert ? "text-amber-800" : "text-slate-950"}`}>{value}</p></div>;
}

function AnalyticsMetric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof TrendingUp; tone: "blue" | "red" | "green" | "violet" }) {
  const tones = { blue: "bg-blue-50 text-blue-700", red: "bg-red-50 text-red-700", green: "bg-emerald-50 text-emerald-700", violet: "bg-violet-50 text-violet-700" };
  return <div className="rounded-2xl border border-[#d6dbfa] bg-white/75 p-4"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p><span className={`grid size-8 place-items-center rounded-xl ${tones[tone]}`}><Icon size={15} /></span></div><p className="mt-3 truncate text-xl font-semibold text-slate-950">{value}</p></div>;
}

function AutomationMetric({ label, value, icon: Icon, alert = false }: { label: string; value: string; icon: typeof Zap; alert?: boolean }) {
  return <div className={`rounded-2xl border px-4 py-3 ${alert ? "border-red-300/30 bg-red-300/10" : "border-white/10 bg-white/[0.06]"}`}><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-stone-300">{label}</p><Icon size={15} className={alert ? "text-red-300" : "text-[#ffc75b]"} /></div><p className={`mt-2 text-xl font-semibold ${alert ? "text-red-100" : "text-white"}`}>{value}</p></div>;
}

function AuditMetric({ label, value, icon: Icon, alert = false }: { label: string; value: string; icon: typeof Fingerprint; alert?: boolean }) {
  return <div className={`rounded-2xl border px-4 py-3 ${alert ? "border-red-300/30 bg-red-300/10" : "border-white/10 bg-white/[0.06]"}`}><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">{label}</p><Icon size={15} className={alert ? "text-red-300" : "text-[#f39797]"} /></div><p className={`mt-2 text-xl font-semibold ${alert ? "text-red-100" : "text-white"}`}>{value}</p></div>;
}

function ApprovalMetric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Inbox; tone: "violet" | "red" | "green" | "slate" }) {
  const tones = { violet: "bg-[#6941c6] text-white", red: "bg-red-50 text-red-700", green: "bg-emerald-50 text-emerald-700", slate: "bg-white text-slate-600" };
  return <div className={`rounded-2xl p-4 ring-1 ring-inset ring-black/5 ${tones[tone]}`}><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-wider opacity-75">{label}</p><Icon size={15} /></div><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}

function BrandStudioMetric({ label, value, detail, tone = "neutral" }: { label: string; value: number; detail: string; tone?: "neutral" | "green" | "orange" | "red" }) {
  const tones = { neutral: "text-[#29211d]", green: "text-emerald-700", orange: "text-[#d55732]", red: "text-red-600" };
  return <div className="rounded-2xl border border-[#eadfd8] bg-white/80 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7b73]">{label}</p><p className={`mt-2 text-2xl font-semibold ${tones[tone]}`}>{value}</p><p className="mt-1 truncate text-[10px] text-[#9a8d85]">{detail}</p></div>;
}

function MigrationMetric({ label, value, icon: Icon, active = false }: { label: string; value: string; icon: typeof Database; active?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${active ? "border-[#62d6ff]/40 bg-[#31b9e8]/15" : "border-white/10 bg-white/[0.06]"}`}><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[#9fb9ca]">{label}</p><Icon size={15} className={active ? "text-[#62d6ff]" : "text-[#7fa2b8]"} /></div><p className="mt-2 text-2xl font-semibold text-white">{value}</p></div>;
}

function MigrationJobDetail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-semibold text-slate-700">{value}</p></div>;
}

function MigrationStep({ label, complete, active }: { label: string; complete: boolean; active: boolean }) {
  return <div className="relative text-center"><div className={`mx-auto grid size-7 place-items-center rounded-full text-[10px] font-bold ${active ? "bg-[#31b9e8] text-[#062034] ring-4 ring-[#cceffa]" : complete ? "bg-[#0b2237] text-white" : "bg-slate-200 text-slate-400"}`}>{complete && !active ? <CheckCheck size={12} /> : "•"}</div><p className={`mt-2 text-[9px] font-bold uppercase tracking-wide ${active ? "text-[#087fa8]" : complete ? "text-slate-700" : "text-slate-400"}`}>{label}</p></div>;
}

function ReadinessCheck({ label, complete }: { label: string; complete: boolean }) {
  return <div className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-3 ring-1 ring-[#d3e9ef]"><span className={`grid size-7 place-items-center rounded-full ${complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}><CheckCircle2 size={14} /></span><span className="text-xs font-semibold text-[#355565]">{label}</span></div>;
}

function getMigrationStage(status: string) {
  if (status === "done") return { label: "Complete", progress: 100, badge: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500" };
  if (status === "active") return { label: "Importing", progress: 75, badge: "bg-cyan-50 text-cyan-700", bar: "bg-cyan-500" };
  if (status === "waiting") return { label: "Validation", progress: 50, badge: "bg-amber-50 text-amber-700", bar: "bg-amber-400" };
  return { label: "Draft", progress: 25, badge: "bg-slate-100 text-slate-600", bar: "bg-slate-400" };
}

function getNextMigrationAction(status: string) {
  if (status === "done") return { label: "Run again", status: "planned", icon: "refresh" };
  if (status === "active") return { label: "Finish & verify", status: "done", icon: "check" };
  if (status === "waiting") return { label: "Start import", status: "active", icon: "play" };
  return { label: "Validate mapping", status: "waiting", icon: "play" };
}

function formatMigrationDate(value: string) {
  if (!value) return "No target";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat(undefined, { notation: value >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function BrandPreviewCheck({ label, complete }: { label: string; complete: boolean }) {
  return <div className="rounded-xl bg-white/6 px-2 py-3 text-center ring-1 ring-white/10"><span className={`mx-auto grid size-6 place-items-center rounded-full ${complete ? "bg-emerald-400/20 text-emerald-300" : "bg-white/10 text-[#78928f]"}`}><CheckCircle2 size={13} /></span><p className="mt-2 text-[9px] font-semibold text-[#bed2cf]">{label}</p></div>;
}

function BrandAssetGlyph({ type, size }: { type: string; size: number }) {
  if (type === "invoice") return <ReceiptText size={size} />;
  if (type === "portal") return <MonitorSmartphone size={size} />;
  if (type === "pdf") return <FileText size={size} />;
  if (type === "email") return <Mail size={size} />;
  if (type === "signature") return <Edit3 size={size} />;
  return <Palette size={size} />;
}

function normalizeBrandColor(value?: string) {
  const candidate = value?.trim();
  if (candidate && (/^#[0-9a-f]{3,8}$/i.test(candidate) || /^rgb(a)?\(/i.test(candidate) || /^hsl(a)?\(/i.test(candidate) || /^[a-z]+$/i.test(candidate))) return candidate;
  return "#d55732";
}

function ApprovalSummaryRow({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-3 text-xs ring-1 ring-white/5"><span className="text-[#c9c0d8]">{label}</span><span className={`font-semibold ${alert ? "text-red-300" : "text-white"}`}>{value}</span></div>;
}

function getApprovalTypeIcon(type: string) {
  if (type === "expense") return CreditCard;
  if (type === "invoice") return ReceiptText;
  if (type === "refund") return ArrowRight;
  if (type === "discount") return Percent;
  if (type === "delete") return Trash2;
  return FileQuestion;
}

function isApprovalOverdue(value: string) {
  return Boolean(value && value < getLocalTodayKey());
}

function compareApprovalPriority(first: LocalRecord, second: LocalRecord) {
  const firstDate = first.dueDate || "9999-12-31";
  const secondDate = second.dueDate || "9999-12-31";
  return firstDate.localeCompare(secondDate) || second.createdAt.localeCompare(first.createdAt);
}

function formatApprovalDate(value: string) {
  if (!value) return "No deadline";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function getApproverWorkload(records: LocalRecord[]) {
  const workload = new Map<string, number>();
  records.forEach((record) => {
    const approver = record.approver.trim() || "Unassigned";
    workload.set(approver, (workload.get(approver) ?? 0) + 1);
  });
  return Array.from(workload.entries()).sort((first, second) => second[1] - first[1]);
}

function RiskCount({ label, value, tone }: { label: string; value: number; tone: "red" | "amber" | "slate" }) {
  const tones = { red: "bg-red-300/10 text-red-200", amber: "bg-amber-300/10 text-amber-200", slate: "bg-white/5 text-slate-300" };
  return <div className={`rounded-2xl p-3 text-center ${tones[tone]}`}><p className="text-[9px] font-semibold uppercase tracking-wide opacity-70">{label}</p><p className="mt-2 text-xl font-semibold text-white">{value}</p></div>;
}

function compareAuditDates(first: LocalRecord, second: LocalRecord) {
  return (second.date || second.createdAt).localeCompare(first.date || first.createdAt);
}

function getAuditRiskTone(risk: string) {
  if (risk === "high") return { dot: "bg-red-500", badge: "bg-red-50 text-red-700" };
  if (risk === "medium") return { dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700" };
  return { dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600" };
}

function formatAuditDay(value: string) {
  if (!value) return "No date";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function formatAuditYear(value: string) {
  if (!value) return "Date unknown";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "" : String(date.getFullYear());
}

function FlowNode({ icon: Icon, eyebrow, title, tone }: { icon: typeof Zap; eyebrow: string; title: string; tone: "amber" | "blue" | "violet" | "red" | "slate" }) {
  const tones = { amber: "bg-amber-50 text-amber-700 ring-amber-200", blue: "bg-blue-50 text-blue-700 ring-blue-200", violet: "bg-violet-50 text-violet-700 ring-violet-200", red: "bg-red-50 text-red-700 ring-red-200", slate: "bg-slate-50 text-slate-600 ring-slate-200" };
  return <div className={`flex min-w-0 items-center gap-3 rounded-2xl p-3 ring-1 ring-inset ${tones[tone]}`}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/70"><Icon size={15} /></span><div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider opacity-60">{eyebrow}</p><p className="mt-1 truncate text-xs font-semibold capitalize">{title}</p></div></div>;
}

function getAutomationTriggerTone(trigger: string): "amber" | "blue" | "violet" | "red" | "slate" {
  if (trigger === "invoice overdue") return "red";
  if (trigger === "stock low") return "amber";
  if (trigger === "booking created") return "blue";
  if (trigger === "document expiring") return "violet";
  return "slate";
}

function isAutomationRunOverdue(value: string) {
  return Boolean(value && value < getLocalTodayKey());
}

function formatAutomationDate(value: string) {
  if (!value) return "Not scheduled";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function SnapshotValue({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 px-2 py-2.5"><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-semibold text-slate-700">{value}</p></div>;
}

function groupBranchPerformance(records: LocalRecord[]) {
  const branches = new Map<string, { name: string; revenue: number; expenses: number; bookings: number; snapshots: number }>();
  records.forEach((record) => {
    const name = record.branch.trim() || "Unnamed branch";
    const current = branches.get(name) ?? { name, revenue: 0, expenses: 0, bookings: 0, snapshots: 0 };
    current.revenue += Number(record.revenue || 0);
    current.expenses += Number(record.expenses || 0);
    current.bookings += Number(record.bookings || 0);
    current.snapshots += 1;
    branches.set(name, current);
  });
  return Array.from(branches.values()).map((branch) => {
    const profit = branch.revenue - branch.expenses;
    return { ...branch, profit, margin: branch.revenue ? Math.round((profit / branch.revenue) * 100) : 0 };
  }).sort((first, second) => second.revenue - first.revenue);
}

function PreviewShortcut({ icon: Icon, label }: { icon: typeof ReceiptText; label: string }) {
  return <div className="rounded-2xl border border-[#f0d9cf] bg-white px-2 py-3 text-center"><Icon size={15} className="mx-auto text-[#b64d35]" /><p className="mt-2 text-[10px] font-semibold text-slate-600">{label}</p></div>;
}

function getPortalTypeIcon(type: string) {
  if (type === "invoice view") return ReceiptText;
  if (type === "document request") return FileQuestion;
  if (type === "booking view") return CalendarDays;
  if (type === "payment link") return CreditCard;
  return MessageCircle;
}

function getPortalInitials(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "C";
}

function getPortalStatusLabel(status: string) {
  if (status === "done") return "complete";
  if (status === "active") return "published";
  if (status === "waiting") return "waiting";
  return "draft";
}

function getPortalActionLabel(type: string) {
  if (type === "invoice view") return "View invoice";
  if (type === "document request") return "Upload document";
  if (type === "booking view") return "View booking";
  if (type === "payment link") return "Open payment";
  return "Open message";
}

function isPortalDueSoon(value: string) {
  if (!value) return false;
  const today = new Date(`${getLocalTodayKey()}T00:00:00`);
  const due = new Date(`${value}T00:00:00`);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  return days <= 7;
}

function formatPortalDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function readLocalCurrency() {
  if (typeof window === "undefined") return "USD";
  try {
    const saved = window.localStorage.getItem("comvexa-workspace-settings");
    return saved ? JSON.parse(saved).currency ?? "USD" : "USD";
  } catch {
    return "USD";
  }
}

function compareOrderDelivery(first: LocalRecord, second: LocalRecord) {
  return (first.expectedDate || "9999-12-31").localeCompare(second.expectedDate || "9999-12-31");
}

function isDeliverySoon(value: string) {
  if (!value) return false;
  const today = new Date(`${getLocalTodayKey()}T00:00:00`);
  const delivery = new Date(`${value}T00:00:00`);
  const days = Math.ceil((delivery.getTime() - today.getTime()) / 86_400_000);
  return days >= 0 && days <= 14;
}

function formatProcurementDate(value: string) {
  if (!value) return "No date";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "2-digit" }).format(date);
}

function getProcurementStatusTone(status: string) {
  if (status === "done") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "waiting") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (status === "active") return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function groupPurchaseOrdersBySupplier(records: LocalRecord[]) {
  const groups = new Map<string, LocalRecord[]>();
  records.forEach((record) => {
    const supplier = record.supplier.trim() || "Unassigned supplier";
    groups.set(supplier, [...(groups.get(supplier) ?? []), record]);
  });
  return Array.from(groups.entries()).sort((first, second) => second[1].length - first[1].length);
}

function getAttendanceTone(type: string) {
  if (type === "absence") return { icon: TimerOff, className: "bg-red-50 text-red-700" };
  if (type === "late") return { icon: AlertTriangle, className: "bg-amber-50 text-amber-700" };
  if (type === "time-off") return { icon: CalendarDays, className: "bg-sky-50 text-sky-700" };
  if (type === "overtime") return { icon: Clock3, className: "bg-violet-50 text-violet-700" };
  return { icon: UserCheck, className: "bg-emerald-50 text-emerald-700" };
}

function getAttendanceInitials(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "?";
}

function getLocalTodayKey() {
  const date = new Date();
  return toLocalDateKey(date);
}

function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftDateKey(value: string, amount: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toLocalDateKey(date);
}

function formatAttendanceDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
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
        <input name={field.name} type={field.type ?? "text"} step={field.type === "number" ? "any" : undefined} required={field.required} defaultValue={value} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
      )}
    </label>
  );
}
