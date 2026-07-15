"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownLeft, BadgeDollarSign, Banknote, Braces, BriefcaseBusiness, Building2, CalendarClock, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, CreditCard, Download, FileText, KeyRound, LockKeyhole, Mail, MapPin, MessageSquareText, Network, Package, Pause, Phone, PhoneCall, Play, Plus, Radar, Receipt, Search, Send, ShieldAlert, ShieldCheck, Smartphone, Store, Tags, Timer, Trash2, TrendingDown, WalletCards, X } from "lucide-react";
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
  variant?: "cards" | "ledger" | "directory" | "compact" | "team" | "schedule" | "catalog" | "subscription" | "cashflow" | "expenses" | "payables" | "network" | "messages" | "permissions";
};

type Row = Record<string, string | number | null>;
type PayableTotals = { outstanding: number; overdue: number; dueSoon: number; paid: number };

const rowsCache = new Map<string, Row[]>();
const directoryPageSize = 20;
const teamPageSize = 12;
const catalogPageSize = 18;
const subscriptionPageSize = 15;
const cashflowPageSize = 25;
const expensesPageSize = 24;
const payablesPageSize = 20;
const networkPageSize = 18;
const messagePageSize = 16;
const shiftTones = ["border-l-violet-400", "border-l-amber-400", "border-l-sky-400", "border-l-rose-400"];

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
  const usesCompactForm = variant === "directory" || variant === "team" || variant === "schedule" || variant === "catalog" || variant === "subscription" || variant === "cashflow" || variant === "expenses" || variant === "payables" || variant === "network" || variant === "messages" || variant === "permissions";
  const usesPagination = variant === "directory" || variant === "team" || variant === "catalog" || variant === "subscription" || variant === "cashflow" || variant === "expenses" || variant === "payables" || variant === "network" || variant === "messages";
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cacheKey, setCacheKey] = useState("");
  const [showForm, setShowForm] = useState(!usesCompactForm);
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [teamStatus, setTeamStatus] = useState("all");
  const [teamDepartment, setTeamDepartment] = useState("all");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [catalogStatus, setCatalogStatus] = useState("all");
  const [catalogType, setCatalogType] = useState("all");
  const [subscriptionStatus, setSubscriptionStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [expenseCategory, setExpenseCategory] = useState("all");
  const [payableStatus, setPayableStatus] = useState("all");
  const [payableUrgency, setPayableUrgency] = useState("all");
  const [messageCategory, setMessageCategory] = useState("all");
  const [messageStatus, setMessageStatus] = useState("all");
  const [permissionRole, setPermissionRole] = useState("all");
  const [permissionAccess, setPermissionAccess] = useState("all");

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

  useEffect(() => {
    if (!selectedRow) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedRow(null);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedRow]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !term || Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesStatus = variant !== "team" || teamStatus === "all" || String(row.status ?? "").toLowerCase() === teamStatus;
      const matchesDepartment = variant !== "team" || teamDepartment === "all" || String(row.department ?? "") === teamDepartment;
      const matchesCatalogStatus = variant !== "catalog" || catalogStatus === "all" || String(row.status ?? "").toLowerCase() === catalogStatus;
      const isTimedService = Number(row.duration_minutes ?? 0) > 0;
      const matchesCatalogType = variant !== "catalog" || catalogType === "all" || (catalogType === "services" ? isTimedService : !isTimedService);
      const matchesSubscriptionStatus = variant !== "subscription" || subscriptionStatus === "all" || String(row.status ?? "").toLowerCase() === subscriptionStatus;
      const matchesPaymentMethod = variant !== "cashflow" || paymentMethod === "all" || String(row.payment_method ?? "").toLowerCase() === paymentMethod;
      const matchesExpenseCategory = variant !== "expenses" || expenseCategory === "all" || normalizeCategory(row.category) === expenseCategory;
      const matchesPayableStatus = variant !== "payables" || payableStatus === "all" || normalizePayableStatus(row.payment_status) === payableStatus;
      const matchesPayableUrgency = variant !== "payables" || payableUrgency === "all" || getPayableUrgency(row).key === payableUrgency;
      const matchesMessageCategory = variant !== "messages" || messageCategory === "all" || String(row.category ?? "").toLowerCase() === messageCategory;
      const matchesMessageStatus = variant !== "messages" || messageStatus === "all" || String(row.status ?? "").toLowerCase() === messageStatus;
      const matchesPermissionRole = variant !== "permissions" || permissionRole === "all" || String(row.role ?? "").toLowerCase() === permissionRole;
      const matchesPermissionAccess = variant !== "permissions" || permissionAccess === "all" || String(row.access_level ?? "").toLowerCase() === permissionAccess;
      return matchesSearch && matchesStatus && matchesDepartment && matchesCatalogStatus && matchesCatalogType && matchesSubscriptionStatus && matchesPaymentMethod && matchesExpenseCategory && matchesPayableStatus && matchesPayableUrgency && matchesMessageCategory && matchesMessageStatus && matchesPermissionRole && matchesPermissionAccess;
    });
  }, [catalogStatus, catalogType, expenseCategory, messageCategory, messageStatus, payableStatus, payableUrgency, paymentMethod, permissionAccess, permissionRole, rows, search, subscriptionStatus, teamDepartment, teamStatus, variant]);

  const departments = useMemo(
    () => Array.from(new Set(rows.map((row) => String(row.department ?? "").trim()).filter(Boolean))).sort(),
    [rows],
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const scheduledHours = rows.reduce((total, row) => total + getShiftHours(row.start_time, row.end_time), 0);
  const scheduledPeople = new Set(rows.map((row) => String(row.employee_name ?? "").trim()).filter(Boolean)).size;

  const pageSize = variant === "team" ? teamPageSize : variant === "catalog" ? catalogPageSize : variant === "subscription" ? subscriptionPageSize : variant === "cashflow" ? cashflowPageSize : variant === "expenses" ? expensesPageSize : variant === "payables" ? payablesPageSize : variant === "network" ? networkPageSize : variant === "messages" ? messagePageSize : directoryPageSize;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = usesPagination
    ? filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredRows;
  const catalogServices = variant === "catalog" ? visibleRows.filter((row) => Number(row.duration_minutes ?? 0) > 0) : [];
  const catalogProducts = variant === "catalog" ? visibleRows.filter((row) => Number(row.duration_minutes ?? 0) <= 0) : [];

  const totalMoney = moneyKey
    ? rows.reduce((sum, row) => sum + Number(row[moneyKey] ?? 0), 0)
    : rows.length;
  const activeCount = statusKey
    ? rows.filter((row) => String(row[statusKey] ?? "").toLowerCase() === "active" || String(row[statusKey] ?? "").toLowerCase() === "paid").length
    : filteredRows.length;
  const monthlyRecurring = variant === "subscription"
    ? rows.filter((row) => String(row.status ?? "").toLowerCase() === "active").reduce((sum, row) => sum + monthlyEquivalent(row), 0)
    : 0;
  const nextRenewal = variant === "subscription" ? findNextRenewal(rows) : null;
  const thisMonthPayments = variant === "cashflow" ? rows.filter((row) => isCurrentMonth(row.payment_date)).reduce((sum, row) => sum + Number(row.amount ?? 0), 0) : 0;
  const expenseTax = variant === "expenses" ? rows.reduce((sum, row) => sum + Number(row.tax_amount ?? 0), 0) : 0;
  const expenseCategories = useMemo(() => Array.from(new Set(rows.map((row) => normalizeCategory(row.category))).values()).sort(), [rows]);
  const visibleExpenseGroups = variant === "expenses" ? groupExpensesByCategory(visibleRows) : [];
  const payableTotals = variant === "payables" ? calculatePayableTotals(rows) : { outstanding: 0, overdue: 0, dueSoon: 0, paid: 0 };
  const permissionUsers = variant === "permissions" ? Array.from(new Set(visibleRows.map((row) => String(row.user_email ?? "").trim()).filter(Boolean))).sort() : [];
  const permissionModules = variant === "permissions" ? Array.from(new Set(visibleRows.map((row) => String(row.module ?? "").trim()).filter(Boolean))).sort() : [];

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
    if (usesCompactForm) {
      setSearch("");
      setPage(1);
      setShowForm(false);
    }
    if (variant === "schedule" && payload.work_date) {
      setWeekStart(startOfWeek(parseDateValue(payload.work_date)));
    }
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

  async function toggleCatalogAvailability(row: Row) {
    if (!row.id) return;
    const previousStatus = String(row.status ?? "inactive").toLowerCase();
    const nextStatus = previousStatus === "active" ? "inactive" : "active";
    const applyStatus = (status: string) => {
      setRows((currentRows) => {
        const nextRows = currentRows.map((item) => item.id === row.id ? { ...item, status } : item);
        if (cacheKey) rowsCache.set(cacheKey, nextRows);
        return nextRows;
      });
    };

    applyStatus(nextStatus);
    const { error: updateError } = await supabase.from(table).update({ status: nextStatus }).eq("id", row.id);

    if (updateError) {
      applyStatus(previousStatus);
      setError(updateError.message);
    }
  }

  async function toggleSubscription(row: Row) {
    if (!row.id) return;
    const previousStatus = String(row.status ?? "active").toLowerCase();
    const nextStatus = previousStatus === "active" ? "paused" : "active";
    const applyStatus = (status: string) => {
      setRows((currentRows) => {
        const nextRows = currentRows.map((item) => item.id === row.id ? { ...item, status } : item);
        if (cacheKey) rowsCache.set(cacheKey, nextRows);
        return nextRows;
      });
    };
    applyStatus(nextStatus);
    const { error: updateError } = await supabase.from(table).update({ status: nextStatus }).eq("id", row.id);
    if (updateError) {
      applyStatus(previousStatus);
      setError(updateError.message);
    }
  }

  async function updatePayableStatus(row: Row, nextStatus: string) {
    if (!row.id) return;
    const previousStatus = String(row.payment_status ?? "unpaid");
    const applyStatus = (payment_status: string) => {
      setRows((currentRows) => {
        const nextRows = currentRows.map((item) => item.id === row.id ? { ...item, payment_status } : item);
        if (cacheKey) rowsCache.set(cacheKey, nextRows);
        return nextRows;
      });
    };
    applyStatus(nextStatus);
    const { error: updateError } = await supabase.from(table).update({ payment_status: nextStatus }).eq("id", row.id);
    if (updateError) {
      applyStatus(previousStatus);
      setError(updateError.message);
    }
  }

  async function toggleMessageStatus(row: Row) {
    if (!row.id) return;
    const previousStatus = String(row.status ?? "draft").toLowerCase();
    const nextStatus = previousStatus === "active" ? "draft" : "active";
    const applyStatus = (status: string) => setRows((currentRows) => {
      const nextRows = currentRows.map((item) => item.id === row.id ? { ...item, status } : item);
      if (cacheKey) rowsCache.set(cacheKey, nextRows);
      return nextRows;
    });
    applyStatus(nextStatus);
    const { error: updateError } = await supabase.from(table).update({ status: nextStatus }).eq("id", row.id);
    if (updateError) {
      applyStatus(previousStatus);
      setError(updateError.message);
    }
  }

  async function updatePermissionAccess(row: Row, nextAccess: string) {
    if (!row.id) return;
    const previousAccess = String(row.access_level ?? "view");
    const applyAccess = (access_level: string) => setRows((currentRows) => {
      const nextRows = currentRows.map((item) => item.id === row.id ? { ...item, access_level } : item);
      if (cacheKey) rowsCache.set(cacheKey, nextRows);
      return nextRows;
    });
    applyAccess(nextAccess);
    const { error: updateError } = await supabase.from(table).update({ access_level: nextAccess }).eq("id", row.id);
    if (updateError) {
      applyAccess(previousAccess);
      setError(updateError.message);
    }
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
      <section className={`dashboard-module-hero rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 ${variant === "subscription" ? "dashboard-custom-hero subscription-renewal-hero" : variant === "cashflow" ? "dashboard-custom-hero cashflow-hero" : variant === "expenses" ? "dashboard-custom-hero expense-control-hero" : variant === "payables" ? "dashboard-custom-hero payables-desk-hero" : variant === "network" ? "dashboard-custom-hero branch-network-hero" : variant === "messages" ? "dashboard-custom-hero message-studio-hero" : variant === "permissions" ? "dashboard-custom-hero permission-matrix-hero" : ""}`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">{eyebrow}</p>
        <div className="mt-3 grid gap-5 xl:grid-cols-[1fr_420px]">
          <div>
            <h2 className="text-3xl font-semibold tracking-normal text-slate-950">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {variant === "permissions" ? (
              <>
                <Metric label="Users" value={String(new Set(rows.map((row) => String(row.user_email ?? "")).filter(Boolean)).size)} />
                <Metric label="Modules" value={String(new Set(rows.map((row) => String(row.module ?? "")).filter(Boolean)).size)} />
                <Metric label="Full access" value={String(rows.filter((row) => String(row.access_level ?? "").toLowerCase() === "full").length)} />
              </>
            ) : variant === "messages" ? (
              <>
                <Metric label="Templates" value={String(rows.length)} />
                <Metric label="Active" value={String(rows.filter((row) => String(row.status ?? "").toLowerCase() === "active").length)} />
                <Metric label="Variables" value={String(rows.reduce((sum, row) => sum + extractMessageVariables(String(row.message ?? "")).length, 0))} />
              </>
            ) : variant === "network" ? (
              <>
                <Metric label="Locations" value={String(rows.length)} />
                <Metric label="Reachable" value={String(rows.filter((row) => String(row.phone ?? "").trim()).length)} />
                <Metric label="Mapped" value={String(rows.filter((row) => String(row.address ?? "").trim()).length)} />
              </>
            ) : variant === "payables" ? (
              <>
                <Metric label="Outstanding" value={formatCurrencyAmount(payableTotals.outstanding, currency)} />
                <Metric label="Overdue" value={formatCurrencyAmount(payableTotals.overdue, currency)} />
                <Metric label="Due soon" value={formatCurrencyAmount(payableTotals.dueSoon, currency)} />
              </>
            ) : variant === "expenses" ? (
              <>
                <Metric label="Total spend" value={formatCurrencyAmount(totalMoney, currency)} />
                <Metric label="Tax tracked" value={formatCurrencyAmount(expenseTax, currency)} />
                <Metric label="Categories" value={String(expenseCategories.length)} />
              </>
            ) : variant === "cashflow" ? (
              <>
                <Metric label="Collected" value={formatCurrencyAmount(totalMoney, currency)} />
                <Metric label="This month" value={formatCurrencyAmount(thisMonthPayments, currency)} />
                <Metric label="Transactions" value={String(rows.length)} />
              </>
            ) : variant === "subscription" ? (
              <>
                <Metric label="Monthly run rate" value={formatCurrencyAmount(monthlyRecurring, currency)} />
                <Metric label="Active plans" value={String(activeCount)} />
                <Metric label="Next renewal" value={nextRenewal ? formatCompactDate(nextRenewal) : "None"} />
              </>
            ) : variant === "catalog" ? (
              <>
                <Metric label="Items" value={String(rows.length)} />
                <Metric label="Catalog value" value={formatCurrencyAmount(totalMoney, currency)} />
                <Metric label="Available" value={String(activeCount)} />
              </>
            ) : variant === "schedule" ? (
              <>
                <Metric label="Shifts" value={String(rows.length)} />
                <Metric label="People" value={String(scheduledPeople)} />
                <Metric label="Hours" value={`${scheduledHours.toFixed(scheduledHours % 1 ? 1 : 0)}h`} />
              </>
            ) : variant === "directory" ? (
              <>
                <Metric label="Customers" value={String(rows.length)} />
                <Metric label="Matches" value={String(filteredRows.length)} />
                <Metric label="Per page" value={String(directoryPageSize)} />
              </>
            ) : (
              <>
                <Metric label="Records" value={String(rows.length)} />
                <Metric label={moneyKey ? "Total" : "Visible"} value={moneyKey ? formatCurrencyAmount(totalMoney, currency) : String(filteredRows.length)} />
                <Metric label={statusKey ? "Active" : "Filtered"} value={String(activeCount)} />
              </>
            )}
          </div>
        </div>
      </section>

      <section className={`mt-6 gap-6 ${usesCompactForm ? "block" : "grid xl:grid-cols-[360px_1fr]"}`}>
        {showForm ? (
        <form onSubmit={handleSave} className={`dashboard-module-form rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 ${usesCompactForm ? "dashboard-module-form-compact mb-4" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-950">{actionLabel}</h3>
              {variant === "directory" ? <p className="mt-1 text-xs text-slate-500">Add the essential details now. Notes are optional.</p> : null}
              {variant === "team" ? <p className="mt-1 text-xs text-slate-500">Create a staff profile with role, department, and employment details.</p> : null}
              {variant === "schedule" ? <p className="mt-1 text-xs text-slate-500">Add a shift and it will appear on the correct day in the weekly planner.</p> : null}
              {variant === "catalog" ? <p className="mt-1 text-xs text-slate-500">Items with a duration appear under timed services; items without one appear as products.</p> : null}
              {variant === "subscription" ? <p className="mt-1 text-xs text-slate-500">Set the customer, billing rhythm, and first renewal date.</p> : null}
              {variant === "cashflow" ? <p className="mt-1 text-xs text-slate-500">Log a collection once, then keep reviewing the activity stream.</p> : null}
              {variant === "expenses" ? <p className="mt-1 text-xs text-slate-500">Capture the cost, tax, vendor, and category in one quick entry.</p> : null}
              {variant === "payables" ? <p className="mt-1 text-xs text-slate-500">Capture the supplier document and its payment deadline.</p> : null}
              {variant === "network" ? <p className="mt-1 text-xs text-slate-500">Connect a location with its address and direct contact line.</p> : null}
              {variant === "messages" ? <p className="mt-1 text-xs text-slate-500">Write the reusable message, choose its purpose, and set its publishing status.</p> : null}
              {variant === "permissions" ? <p className="mt-1 text-xs text-slate-500">Assign one user, role, module, and access level per rule.</p> : null}
            </div>
            {usesCompactForm ? (
              <button type="button" onClick={() => setShowForm(false)} className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label={`Close ${actionLabel.toLowerCase()} form`}>
                <X size={17} />
              </button>
            ) : null}
          </div>
          <div className={`mt-5 grid gap-4 ${variant === "directory" ? "sm:grid-cols-2 xl:grid-cols-5" : variant === "team" ? "sm:grid-cols-2 xl:grid-cols-4" : variant === "schedule" ? "sm:grid-cols-2 xl:grid-cols-6" : variant === "catalog" ? "sm:grid-cols-2 xl:grid-cols-5" : variant === "subscription" ? "sm:grid-cols-2 xl:grid-cols-4" : variant === "cashflow" ? "sm:grid-cols-2 xl:grid-cols-4" : variant === "expenses" ? "sm:grid-cols-2 xl:grid-cols-4" : variant === "payables" ? "sm:grid-cols-2 xl:grid-cols-4" : variant === "network" ? "sm:grid-cols-3 xl:grid-cols-4" : variant === "messages" ? "sm:grid-cols-2 xl:grid-cols-4" : variant === "permissions" ? "sm:grid-cols-2 xl:grid-cols-5" : ""}`}>
            {fields.map((field) => (
              <div key={field.name} className={variant === "directory" && field.type === "textarea" ? "sm:col-span-2 xl:col-span-4" : variant === "schedule" && field.type === "textarea" ? "sm:col-span-2 xl:col-span-5" : variant === "catalog" && field.type === "textarea" ? "sm:col-span-2 xl:col-span-4" : variant === "subscription" && field.type === "textarea" ? "sm:col-span-2 xl:col-span-3" : variant === "cashflow" && field.type === "textarea" ? "sm:col-span-2 xl:col-span-3" : variant === "payables" && field.type === "textarea" ? "sm:col-span-2 xl:col-span-3" : variant === "messages" && field.type === "textarea" ? "sm:col-span-2 xl:col-span-3" : ""}>
                <FieldInput field={field} compact={usesCompactForm} />
              </div>
            ))}
            {error ? <p className={`rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100 ${usesCompactForm ? "sm:col-span-2 xl:col-span-full" : ""}`} role="alert">{error}</p> : null}
            <button disabled={!companyId || isSaving} className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300">
              <Plus size={17} />
              {isSaving ? "Saving..." : actionLabel}
            </button>
          </div>
        </form>
        ) : null}

        <section className="dashboard-module-records rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-300 px-3 text-sm text-slate-500 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 sm:max-w-sm">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={`Search ${title.toLowerCase()}`}
                className="w-full bg-transparent outline-none"
              />
            </label>
            <div className="flex gap-2">
              {usesCompactForm && !showForm ? (
                <button type="button" onClick={() => setShowForm(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
                  <Plus size={16} />
                  {actionLabel}
                </button>
              ) : null}
              <button type="button" onClick={exportCsv} disabled={!filteredRows.length} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
          {usesCompactForm && error && !showForm ? (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100" role="alert">{error}</p>
          ) : null}

          {variant === "permissions" ? (
            <div className="permission-filter-console mt-4 grid gap-3 rounded-2xl border border-slate-200 p-3 sm:grid-cols-2"><label className="flex items-center gap-2 text-xs font-semibold text-slate-500">Role<select value={permissionRole} onChange={(event) => setPermissionRole(event.target.value)} className="h-10 min-w-36 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"><option value="all">All roles</option><option value="staff">Staff</option><option value="manager">Manager</option><option value="admin">Admin</option></select></label><label className="flex items-center gap-2 text-xs font-semibold text-slate-500">Access<select value={permissionAccess} onChange={(event) => setPermissionAccess(event.target.value)} className="h-10 min-w-36 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"><option value="all">All levels</option><option value="view">View</option><option value="create">Create</option><option value="edit">Edit</option><option value="full">Full</option></select></label></div>
          ) : variant === "messages" ? (
            <div className="message-studio-layout mt-5 grid gap-4 xl:grid-cols-[180px_minmax(0,1fr)_260px]">
              <aside className="message-category-rail self-start rounded-3xl bg-[#111b21] p-4 text-white xl:sticky xl:top-24"><div className="flex items-center gap-2"><MessageSquareText size={17} className="text-[#25d366]" /><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Library</p></div><div className="mt-4 space-y-1">{(["Reminder", "Booking", "Payment", "General"] as const).map((category) => { const count = rows.filter((row) => String(row.category ?? "").toLowerCase() === category.toLowerCase()).length; return <button key={category} type="button" onClick={() => { setMessageCategory(category.toLowerCase()); setPage(1); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold ${messageCategory === category.toLowerCase() ? "bg-[#075e54] text-white" : "text-slate-300 hover:bg-white/5"}`}><span>{category}</span><span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{count}</span></button>; })}</div><div className="mt-5 border-t border-white/10 pt-4"><p className="text-[10px] leading-5 text-slate-400">Use variables like <span className="font-mono text-[#7ee2a8]">{"{{customer}}"}</span> to personalize each send.</p></div></aside>

              <section className="message-chat-canvas overflow-hidden rounded-3xl border border-slate-200 bg-[#efeae2]">
                <header className="flex items-center justify-between gap-4 bg-[#075e54] px-5 py-4 text-white"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-white/10"><Smartphone size={18} /></span><div><h3 className="font-semibold text-white">Template conversation</h3><p className="mt-0.5 text-[10px] text-emerald-100/70">Reusable messages ready for customers</p></div></div><Send size={18} className="text-[#7ee2a8]" /></header>
                <div className="message-wall min-h-[30rem] space-y-4 p-4 sm:p-6">
                  {isLoading ? Array.from({ length: 4 }, (_, index) => <div key={index} className={`h-28 animate-pulse rounded-2xl bg-white/60 ${index % 2 ? "ml-auto max-w-[76%]" : "max-w-[76%]"}`} />) : visibleRows.length ? visibleRows.map((row, index) => {
                    const active = String(row.status ?? "").toLowerCase() === "active";
                    const variables = extractMessageVariables(String(row.message ?? ""));
                    return <article key={String(row.id)} className={`message-template-bubble group relative w-fit max-w-[92%] rounded-2xl p-4 shadow-sm sm:max-w-[78%] ${index % 2 === 0 ? "ml-auto rounded-tr-sm bg-[#d9fdd3]" : "rounded-tl-sm bg-white"}`}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-bold text-slate-900">{String(row[titleKey] ?? "Untitled template")}</p><span className="rounded-full bg-black/5 px-2 py-0.5 text-[9px] font-semibold capitalize text-slate-600">{String(row.category ?? "General")}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{highlightTemplateMessage(String(row.message ?? "No message written."))}</p>{variables.length ? <div className="mt-3 flex flex-wrap gap-1">{variables.map((variable) => <span key={variable} className="rounded-md bg-white/60 px-1.5 py-1 font-mono text-[9px] text-[#075e54]">{`{{${variable}}}`}</span>)}</div> : null}</div><button type="button" onClick={() => void deleteRow(row.id)} className="shrink-0 rounded-lg p-1.5 text-slate-400 opacity-60 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" aria-label={`Delete ${String(row[titleKey] ?? "template")}`}><Trash2 size={14} /></button></div><div className="mt-3 flex items-center justify-end gap-2 border-t border-black/5 pt-2"><span className="text-[9px] text-slate-400">{formatRowDate(row.created_at)}</span><button type="button" onClick={() => void toggleMessageStatus(row)} className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${active ? "bg-[#075e54] text-white" : "bg-slate-200 text-slate-600"}`}>{active ? "Active" : "Draft"}</button></div></article>;
                  }) : <div className="grid min-h-[26rem] place-items-center text-center"><div><MessageSquareText size={38} className="mx-auto text-slate-400" /><p className="mt-3 font-semibold text-slate-700">No templates in this conversation</p><p className="mt-1 text-sm text-slate-500">Add a message or change the filters.</p></div></div>}
                </div>
              </section>

              <aside className="message-quality-panel self-start rounded-3xl border border-emerald-100 bg-[#f3fbf7] p-5 xl:sticky xl:top-24"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#075e54]">Template health</p><h3 className="mt-2 text-lg font-semibold text-slate-950">Message signals</h3></div><Braces size={20} className="text-[#128c7e]" /></div><div className="mt-5 grid grid-cols-2 gap-2"><MessageSignal label="Active" value={rows.filter((row) => String(row.status ?? "").toLowerCase() === "active").length} tone="green" /><MessageSignal label="Drafts" value={rows.filter((row) => String(row.status ?? "").toLowerCase() === "draft").length} tone="amber" /><MessageSignal label="With variables" value={rows.filter((row) => extractMessageVariables(String(row.message ?? "")).length > 0).length} tone="blue" /><MessageSignal label="Plain text" value={rows.filter((row) => !extractMessageVariables(String(row.message ?? "")).length).length} tone="slate" /></div><div className="mt-5 rounded-2xl border border-emerald-100 bg-white p-4"><p className="text-xs font-semibold text-slate-800">Variable guide</p><div className="mt-3 space-y-2 font-mono text-[10px] text-[#075e54]"><p>{"{{customer}}"} <span className="font-sans text-slate-400">customer name</span></p><p>{"{{date}}"} <span className="font-sans text-slate-400">booking date</span></p><p>{"{{amount}}"} <span className="font-sans text-slate-400">payment amount</span></p><p>{"{{company}}"} <span className="font-sans text-slate-400">workspace name</span></p></div></div></aside>
              {!isLoading && filteredRows.length ? <div className="xl:col-span-3"><PaginationControls currentPage={currentPage} pageCount={pageCount} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} /></div> : null}
            </div>
          ) : variant === "network" ? (
            <div className="mt-5">
              <section className="branch-network-map overflow-hidden rounded-[2rem] bg-[#082f49] p-5 text-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-cyan-200"><Network size={16} /><p className="text-[10px] font-semibold uppercase tracking-[0.18em]">Live topology</p></div><h3 className="mt-2 text-xl font-semibold text-white">Workspace location network</h3></div><span className="w-fit rounded-full bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 ring-1 ring-cyan-200/20">{rows.length} connected node{rows.length === 1 ? "" : "s"}</span></div>
                <div className="mt-6 grid gap-3 lg:grid-cols-[220px_1fr] lg:items-center">
                  <div className="branch-hub-node flex items-center gap-3 rounded-3xl border border-cyan-200/20 bg-white/10 p-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-[#082f49]"><Building2 size={21} /></span><div><p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200">Main hub</p><p className="mt-1 font-semibold text-white">Comvexa workspace</p></div></div>
                  <div className="branch-node-grid grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleRows.slice(0, 6).map((row, index) => <button key={String(row.id)} type="button" onClick={() => setSelectedRow(row)} className="branch-map-node flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-left hover:border-cyan-200/30 hover:bg-white/10"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-bold text-cyan-200">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0"><span className="block truncate text-xs font-semibold text-white">{String(row[titleKey] ?? "Unnamed branch")}</span><span className="mt-1 block truncate text-[10px] text-slate-300">{String(row.address ?? "Address not mapped")}</span></span></button>)}
                    {!visibleRows.length ? <div className="grid min-h-24 place-items-center rounded-2xl border border-dashed border-white/15 text-center text-xs text-slate-400 sm:col-span-2 xl:col-span-3">Add a branch to connect the first network node.</div> : null}
                  </div>
                </div>
              </section>

              <section className="branch-switchboard mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4"><div><h3 className="font-semibold text-slate-950">Location switchboard</h3><p className="mt-1 text-xs text-slate-500">Open any location for its complete contact details</p></div><PhoneCall size={19} className="text-cyan-700" /></header>
                <div className="divide-y divide-slate-100">
                  {isLoading ? Array.from({ length: 5 }, (_, index) => <div key={index} className="h-20 animate-pulse bg-slate-50" />) : visibleRows.length ? visibleRows.map((row, index) => (
                    <article key={String(row.id)} className="branch-switchboard-row group grid gap-3 bg-white px-5 py-4 md:grid-cols-[54px_minmax(160px,1fr)_minmax(200px,1.4fr)_150px_90px] md:items-center">
                      <span className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-xs font-bold text-cyan-800 ring-1 ring-cyan-100">{String((currentPage - 1) * pageSize + index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{String(row[titleKey] ?? "Unnamed branch")}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Connected</p></div>
                      <p className="flex min-w-0 items-center gap-2 text-xs text-slate-500"><MapPin size={14} className="shrink-0 text-slate-400" /><span className="truncate">{String(row.address ?? "Address not provided")}</span></p>
                      <p className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-600"><Phone size={14} className="shrink-0 text-slate-400" /><span className="truncate">{String(row.phone ?? "No phone")}</span></p>
                      <div className="flex justify-end gap-1"><button type="button" onClick={() => setSelectedRow(row)} className="grid size-9 place-items-center rounded-xl text-cyan-700 hover:bg-cyan-50" aria-label={`View ${String(row[titleKey] ?? "branch")}`}><ChevronRight size={16} /></button><button type="button" onClick={() => void deleteRow(row.id)} className="grid size-9 place-items-center rounded-xl text-slate-300 opacity-70 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" aria-label={`Delete ${String(row[titleKey] ?? "branch")}`}><Trash2 size={15} /></button></div>
                    </article>
                  )) : <div className="grid min-h-52 place-items-center p-8 text-center"><div><Network size={32} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No branch locations connected</p></div></div>}
                </div>
              </section>
              {!isLoading && filteredRows.length ? <PaginationControls currentPage={currentPage} pageCount={pageCount} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} /> : null}
            </div>
          ) : variant === "payables" ? (
            <div className="payables-filter-strip mt-4 grid gap-3 rounded-2xl border border-slate-200 p-3 md:grid-cols-2">
              <div className="flex gap-1 overflow-x-auto" aria-label="Filter bill status">
                {(["all", "unpaid", "pending", "paid"] as const).map((status) => <button key={status} type="button" onClick={() => { setPayableStatus(status); setPage(1); }} aria-pressed={payableStatus === status} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold capitalize ${payableStatus === status ? "bg-[#172554] text-white" : "bg-white text-slate-600 hover:bg-blue-50"}`}>{status}</button>)}
              </div>
              <div className="flex gap-1 overflow-x-auto md:justify-end" aria-label="Filter due urgency">
                {(["all", "overdue", "soon", "later", "no-date"] as const).map((urgency) => <button key={urgency} type="button" onClick={() => { setPayableUrgency(urgency); setPage(1); }} aria-pressed={payableUrgency === urgency} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold capitalize ${payableUrgency === urgency ? "bg-amber-400 text-slate-950" : "bg-white text-slate-600 hover:bg-amber-50"}`}>{urgency === "all" ? "Any due date" : urgency === "no-date" ? "No date" : urgency}</button>)}
              </div>
            </div>
          ) : variant === "expenses" ? (
            <div className="expense-filter-strip mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-1.5 overflow-x-auto" aria-label="Filter expense category">
                {["all", ...expenseCategories].map((category) => (
                  <button key={category} type="button" onClick={() => { setExpenseCategory(category); setPage(1); }} aria-pressed={expenseCategory === category} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold capitalize ${expenseCategory === category ? "bg-[#7f1d1d] text-white" : "bg-white text-slate-600 hover:bg-rose-50"}`}>{category === "all" ? "All categories" : category}</button>
                ))}
              </div>
              <p className="text-xs font-medium text-slate-500">{filteredRows.length} expense{filteredRows.length === 1 ? "" : "s"}</p>
            </div>
          ) : variant === "cashflow" ? (
            <div className="cashflow-filter-strip mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-1 overflow-x-auto" aria-label="Filter payment method">
                {(["all", "card", "bank transfer", "cash", "online"] as const).map((method) => (
                  <button key={method} type="button" onClick={() => { setPaymentMethod(method); setPage(1); }} aria-pressed={paymentMethod === method} className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold capitalize ${paymentMethod === method ? "bg-[#064e3b] text-white" : "bg-white text-slate-600 hover:bg-emerald-50"}`}>{method === "all" ? "All methods" : method}</button>
                ))}
              </div>
              <p className="text-xs font-medium text-slate-500">Newest collections appear first</p>
            </div>
          ) : variant === "subscription" ? (
            <div className="subscription-filter-strip mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex overflow-x-auto rounded-xl bg-slate-100 p-1" aria-label="Filter recurring invoices">
                {(["all", "active", "paused", "cancelled"] as const).map((status) => (
                  <button key={status} type="button" onClick={() => { setSubscriptionStatus(status); setPage(1); }} aria-pressed={subscriptionStatus === status} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${subscriptionStatus === status ? "bg-[#1f2937] text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}>{status}</button>
                ))}
              </div>
              <p className="text-xs font-medium text-slate-500">{filteredRows.length} schedule{filteredRows.length === 1 ? "" : "s"} shown</p>
            </div>
          ) : variant === "catalog" ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" aria-label="Filter catalog type">
                {(["all", "services", "products"] as const).map((type) => (
                  <button key={type} type="button" onClick={() => { setCatalogType(type); setPage(1); }} aria-pressed={catalogType === type} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${catalogType === type ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{type}</button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                Availability
                <select value={catalogStatus} onChange={(event) => { setCatalogStatus(event.target.value); setPage(1); }} className="h-10 min-w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100">
                  <option value="all">All items</option>
                  <option value="active">Available</option>
                  <option value="inactive">Unavailable</option>
                </select>
              </label>
            </div>
          ) : null}

          {variant === "permissions" ? (
            <div className="permission-matrix-layout mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
              <section className="permission-matrix-shell overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <header className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-blue-700"><KeyRound size={16} /><p className="text-[10px] font-semibold uppercase tracking-[0.18em]">Access matrix</p></div><h3 className="mt-1 font-semibold text-slate-950">Modules × users</h3></div><p className="text-xs text-slate-500">Change access directly inside any assigned cell</p></header>
                <div className="overflow-x-auto">
                  <div className="permission-grid" style={{ minWidth: `${Math.max(720, 220 + permissionUsers.length * 190)}px` }}>
                    <div className="grid border-b border-slate-200 bg-[#edf4ff]" style={{ gridTemplateColumns: `220px repeat(${Math.max(1, permissionUsers.length)}, minmax(190px, 1fr))` }}><div className="px-4 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Workspace module</div>{permissionUsers.map((user) => { const role = visibleRows.find((row) => String(row.user_email ?? "") === user)?.role; return <div key={user} className="border-l border-blue-100 px-4 py-3"><p className="truncate text-xs font-semibold text-slate-800">{user}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-blue-600">{String(role ?? "Staff")}</p></div>; })}{!permissionUsers.length ? <div className="border-l border-blue-100 px-4 py-3 text-xs text-slate-400">No users assigned</div> : null}</div>
                    {permissionModules.map((module) => <div key={module} className="grid border-b border-slate-100 last:border-b-0" style={{ gridTemplateColumns: `220px repeat(${Math.max(1, permissionUsers.length)}, minmax(190px, 1fr))` }}><div className="flex items-center gap-3 bg-slate-50/70 px-4 py-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"><LockKeyhole size={15} /></span><p className="truncate text-xs font-semibold text-slate-800">{module}</p></div>{permissionUsers.map((user) => { const rule = visibleRows.find((row) => String(row.user_email ?? "") === user && String(row.module ?? "") === module); return <div key={user} className="grid min-h-16 place-items-center border-l border-slate-100 p-3">{rule ? <div className="flex w-full items-center gap-1"><select value={String(rule.access_level ?? "View").toLowerCase()} onChange={(event) => void updatePermissionAccess(rule, event.target.value)} className={`h-9 min-w-0 flex-1 rounded-xl border-0 px-2 text-xs font-semibold capitalize outline-none ring-1 ring-inset ${permissionAccessTone(rule.access_level)}`} aria-label={`${module} access for ${user}`}><option value="view">View</option><option value="create">Create</option><option value="edit">Edit</option><option value="full">Full</option></select><button type="button" onClick={() => void deleteRow(rule.id)} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${module} access for ${user}`}><Trash2 size={13} /></button></div> : <span className="text-lg text-slate-200">—</span>}</div>; })}</div>)}
                    {!permissionModules.length ? <div className="grid min-h-64 place-items-center p-8 text-center"><div><LockKeyhole size={34} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No access rules in this view</p><p className="mt-1 text-sm text-slate-500">Add a permission or change the filters.</p></div></div> : null}
                  </div>
                </div>
              </section>

              <aside className="permission-risk-panel self-start rounded-3xl bg-[#101828] p-5 text-white xl:sticky xl:top-24"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Security scan</p><h3 className="mt-2 text-lg font-semibold text-white">Access exposure</h3></div><ShieldAlert size={21} className="text-amber-300" /></div><div className="mt-5 space-y-3"><SecurityCount label="Admin rules" value={rows.filter((row) => String(row.role ?? "").toLowerCase() === "admin").length} tone="amber" /><SecurityCount label="Full access" value={rows.filter((row) => String(row.access_level ?? "").toLowerCase() === "full").length} tone="red" /><SecurityCount label="Limited rules" value={rows.filter((row) => String(row.access_level ?? "").toLowerCase() !== "full").length} tone="blue" /></div><div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"><div className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-300" /><p className="text-xs font-semibold text-white">Least-access check</p></div><p className="mt-2 text-[11px] leading-5 text-slate-400">Review Full access and Admin rules regularly. Remove unused module assignments directly from the matrix.</p></div></aside>
            </div>
          ) : variant === "messages" ? (
            <div className="message-filter-console mt-4 grid gap-3 rounded-2xl border border-slate-200 p-3 lg:grid-cols-[1fr_auto]">
              <div className="flex gap-1 overflow-x-auto" aria-label="Filter message category">{(["all", "reminder", "booking", "payment", "general"] as const).map((category) => <button key={category} type="button" onClick={() => { setMessageCategory(category); setPage(1); }} aria-pressed={messageCategory === category} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold capitalize ${messageCategory === category ? "bg-[#075e54] text-white" : "bg-white text-slate-600 hover:bg-emerald-50"}`}>{category === "all" ? "All messages" : category}</button>)}</div>
              <select value={messageStatus} onChange={(event) => { setMessageStatus(event.target.value); setPage(1); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"><option value="all">Any status</option><option value="active">Active</option><option value="draft">Draft</option><option value="inactive">Inactive</option></select>
            </div>
          ) : variant === "payables" ? (
            <div className="mt-5">
              <div className="payables-pressure-grid grid overflow-hidden rounded-3xl border border-slate-200 bg-white sm:grid-cols-3">
                <PayablePressure icon={AlertTriangle} label="Past deadline" value={payableTotals.overdue} currency={currency} tone="danger" />
                <PayablePressure icon={CalendarClock} label="Due within 7 days" value={payableTotals.dueSoon} currency={currency} tone="warning" />
                <PayablePressure icon={CheckCircle2} label="Already settled" value={payableTotals.paid} currency={currency} tone="success" />
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                <section className="payables-inbox overflow-hidden rounded-3xl border border-slate-200 bg-white">
                  <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-blue-100 text-blue-800"><FileText size={18} /></span><div><h3 className="font-semibold text-slate-950">Bills inbox</h3><p className="mt-0.5 text-xs text-slate-500">Sorted by the nearest payment deadline</p></div></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{filteredRows.length}</span></header>
                  <div className="divide-y divide-slate-100">
                    {isLoading ? Array.from({ length: 5 }, (_, index) => <div key={index} className="h-24 animate-pulse bg-slate-50" />) : visibleRows.length ? [...visibleRows].sort(comparePayableDueDates).map((row) => {
                      const urgency = getPayableUrgency(row);
                      const status = normalizePayableStatus(row.payment_status);
                      return (
                        <article key={String(row.id)} className={`payables-inbox-row group grid gap-3 border-l-4 px-5 py-4 md:grid-cols-[minmax(160px,1fr)_125px_115px_130px_42px] md:items-center ${urgency.borderClass}`}>
                          <div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-slate-950">{String(row[titleKey] ?? "Unknown supplier")}</p><span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${urgency.className}`}>{urgency.label}</span></div><p className="mt-1 truncate text-xs text-slate-400">Bill #{String(row.bill_number ?? "not set")}</p></div>
                          <div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Due</p><p className="mt-1 text-xs font-semibold text-slate-700">{formatPaymentDate(row.due_date)}</p></div>
                          <p className="text-base font-semibold text-slate-950 md:text-right">{formatCurrencyAmount(Number(row.total_amount ?? 0), currency, false, 2)}</p>
                          <select value={status} onChange={(event) => void updatePayableStatus(row, event.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold capitalize text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" aria-label={`Payment status for ${String(row[titleKey] ?? "bill")}`}><option value="unpaid">Unpaid</option><option value="pending">Pending</option><option value="paid">Paid</option></select>
                          <button type="button" onClick={() => void deleteRow(row.id)} className="grid size-9 place-items-center rounded-xl text-slate-300 opacity-70 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" aria-label={`Delete bill from ${String(row[titleKey] ?? "supplier")}`}><Trash2 size={15} /></button>
                        </article>
                      );
                    }) : <div className="grid min-h-60 place-items-center p-8 text-center"><div><FileText size={30} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-500">No supplier bills in this view</p></div></div>}
                  </div>
                </section>

                <aside className="payables-radar self-start rounded-3xl bg-[#172554] p-5 text-white xl:sticky xl:top-24">
                  <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200">Due-date radar</p><h3 className="mt-2 text-xl font-semibold text-white">Payables pressure</h3></div><Radar size={23} className="text-amber-300" /></div>
                  <div className="mx-auto mt-6 grid aspect-square max-w-48 place-items-center rounded-full border-[18px] border-blue-950 bg-blue-900/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"><div className="text-center"><p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">Outstanding</p><p className="mt-2 text-2xl font-semibold text-white">{formatCurrencyAmount(payableTotals.outstanding, currency)}</p></div></div>
                  <div className="mt-6 space-y-3 border-t border-white/10 pt-5"><RadarLine color="bg-red-400" label="Overdue" value={payableTotals.overdue} currency={currency} /><RadarLine color="bg-amber-300" label="Due soon" value={payableTotals.dueSoon} currency={currency} /><RadarLine color="bg-blue-300" label="Later / unscheduled" value={Math.max(0, payableTotals.outstanding - payableTotals.overdue - payableTotals.dueSoon)} currency={currency} /></div>
                </aside>
              </div>
              {!isLoading && filteredRows.length ? <PaginationControls currentPage={currentPage} pageCount={pageCount} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} /> : null}
            </div>
          ) : variant === "expenses" ? (
            <div className="mt-5">
              <section className="expense-spend-map rounded-3xl bg-[#2b1d1d] p-5 text-white">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div><div className="flex items-center gap-2 text-rose-200"><TrendingDown size={17} /><p className="text-[10px] font-semibold uppercase tracking-[0.18em]">Spend map</p></div><h3 className="mt-2 text-xl font-semibold text-white">Where the money went</h3></div>
                  <p className="text-2xl font-semibold text-white">{formatCurrencyAmount(totalMoney, currency)}</p>
                </div>
                <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-white/10">
                  {expenseCategories.map((category, index) => {
                    const categoryTotal = expenseCategoryTotal(rows, category);
                    const width = totalMoney ? (categoryTotal / totalMoney) * 100 : 0;
                    return <div key={category} className={expenseSegmentTone(index)} style={{ width: `${width}%` }} title={`${category}: ${formatCurrencyAmount(categoryTotal, currency)}`} />;
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  {expenseCategories.slice(0, 8).map((category, index) => <span key={category} className="inline-flex items-center gap-2 text-[11px] text-stone-300"><span className={`size-2 rounded-full ${expenseSegmentTone(index)}`} />{category}</span>)}
                </div>
              </section>

              <div className="mt-5 grid items-start gap-4 lg:grid-cols-2">
                {isLoading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-56 animate-pulse rounded-3xl bg-slate-100" />) : visibleExpenseGroups.length ? visibleExpenseGroups.map(([category, categoryRows], groupIndex) => (
                  <section key={category} className="expense-envelope overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-[#fff8f5] px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${expenseCategoryTone(groupIndex)}`}><Tags size={17} /></span><div className="min-w-0"><h3 className="truncate font-semibold capitalize text-slate-950">{category}</h3><p className="mt-0.5 text-xs text-slate-500">{categoryRows.length} item{categoryRows.length === 1 ? "" : "s"}</p></div></div>
                      <p className="text-lg font-semibold text-slate-950">{formatCurrencyAmount(categoryRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0), currency)}</p>
                    </header>
                    <div className="divide-y divide-slate-100">
                      {categoryRows.map((row) => (
                        <article key={String(row.id)} className="expense-envelope-row group grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_110px_38px] sm:items-center">
                          <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{String(row[titleKey] ?? "Untitled expense")}</p><div className="mt-1 flex min-w-0 items-center gap-3 text-[11px] text-slate-500"><span className="inline-flex min-w-0 items-center gap-1"><Store size={12} className="shrink-0" /><span className="truncate">{String(row.vendor ?? "No vendor")}</span></span><span>{formatPaymentDate(row.expense_date)}</span></div></div>
                          <div className="sm:text-right"><p className="text-sm font-semibold text-slate-950">{formatCurrencyAmount(Number(row.amount ?? 0), currency, false, 2)}</p>{Number(row.tax_amount ?? 0) ? <p className="mt-1 text-[10px] text-slate-400">+ {formatCurrencyAmount(Number(row.tax_amount), currency)} tax</p> : null}</div>
                          <button type="button" onClick={() => void deleteRow(row.id)} className="grid size-9 place-items-center rounded-xl text-slate-300 opacity-70 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" aria-label={`Delete ${String(row[titleKey] ?? "expense")}`}><Trash2 size={15} /></button>
                        </article>
                      ))}
                    </div>
                  </section>
                )) : <div className="grid min-h-56 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center lg:col-span-2"><div><Receipt size={30} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-500">No expenses in this view</p></div></div>}
              </div>
              {!isLoading && filteredRows.length ? <PaginationControls currentPage={currentPage} pageCount={pageCount} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} /> : null}
            </div>
          ) : variant === "cashflow" ? (
            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
              <section className="cashflow-receipt overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <header className="flex items-center justify-between gap-4 border-b border-dashed border-slate-300 px-5 py-4">
                  <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><ArrowDownLeft size={19} /></span><div><h3 className="font-semibold text-slate-950">Money received</h3><p className="mt-0.5 text-xs text-slate-500">A chronological collection stream</p></div></div>
                  <span className="text-xs font-semibold text-slate-400">{filteredRows.length} entries</span>
                </header>
                <div className="divide-y divide-dashed divide-slate-200">
                  {isLoading ? Array.from({ length: 5 }, (_, index) => <div key={index} className="h-20 animate-pulse bg-slate-50" />) : visibleRows.length ? visibleRows.map((row) => {
                    const MethodIcon = getPaymentMethodIcon(row.payment_method);
                    return (
                      <article key={String(row.id)} className="cashflow-entry group grid gap-3 px-5 py-4 sm:grid-cols-[48px_minmax(0,1fr)_140px_44px] sm:items-center">
                        <span className="grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-600"><MethodIcon size={18} /></span>
                        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-950">{formatCurrencyAmount(Number(row.amount ?? 0), currency, false, 2)}</p><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Received</span></div><p className="mt-1 truncate text-xs text-slate-500">{String(row.notes ?? "No note attached")}</p></div>
                        <div className="sm:text-right"><p className="text-xs font-semibold capitalize text-slate-700">{String(row.payment_method ?? "Other")}</p><p className="mt-1 text-[11px] text-slate-400">{formatPaymentDate(row.payment_date)}</p></div>
                        <button type="button" onClick={() => void deleteRow(row.id)} className="grid size-9 place-items-center rounded-xl text-slate-300 opacity-70 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" aria-label="Delete payment"><Trash2 size={15} /></button>
                      </article>
                    );
                  }) : <div className="grid min-h-56 place-items-center px-6 text-center"><div><CircleDollarSign size={30} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-500">No payments in this view</p></div></div>}
                </div>
              </section>

              <aside className="cashflow-method-panel self-start rounded-3xl border border-emerald-900 bg-[#064e3b] p-5 text-white xl:sticky xl:top-24">
                <div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Collection mix</p><h3 className="mt-2 text-xl font-semibold text-white">Payment methods</h3></div><WalletCards size={23} className="text-emerald-300" /></div>
                <div className="mt-5 space-y-2">
                  {(["Card", "Bank transfer", "Cash", "Online"] as const).map((method) => {
                    const methodRows = rows.filter((row) => String(row.payment_method ?? "").toLowerCase() === method.toLowerCase());
                    const amount = methodRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
                    return <button key={method} type="button" onClick={() => { setPaymentMethod(method.toLowerCase()); setPage(1); }} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-3 text-left ring-1 ring-white/10 hover:bg-white/10"><span><span className="block text-xs font-semibold text-white">{method}</span><span className="mt-1 block text-[10px] text-emerald-200/70">{methodRows.length} payment{methodRows.length === 1 ? "" : "s"}</span></span><span className="text-sm font-semibold text-white">{formatCurrencyAmount(amount, currency)}</span></button>;
                  })}
                </div>
                <div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs text-emerald-100/70">Average collection</p><p className="mt-1 text-2xl font-semibold text-white">{formatCurrencyAmount(rows.length ? totalMoney / rows.length : 0, currency)}</p></div>
              </aside>
              {!isLoading && filteredRows.length ? <div className="xl:col-span-2"><PaginationControls currentPage={currentPage} pageCount={pageCount} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} /></div> : null}
            </div>
          ) : variant === "subscription" ? (
            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
              <section className="subscription-timeline overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                  <div>
                    <h3 className="font-semibold text-slate-950">Renewal timeline</h3>
                    <p className="mt-1 text-xs text-slate-500">Upcoming billing schedules ordered by renewal date</p>
                  </div>
                  <CalendarClock size={20} className="text-[#7c3aed]" />
                </header>
                <div className="divide-y divide-slate-100">
                  {isLoading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse bg-slate-50" />) : visibleRows.length ? [...visibleRows].sort(compareRenewalDates).map((row) => {
                    const status = String(row.status ?? "active").toLowerCase();
                    const active = status === "active";
                    return (
                      <article key={String(row.id)} className="subscription-renewal-row grid gap-4 px-5 py-4 md:grid-cols-[72px_minmax(0,1fr)_110px_110px_92px] md:items-center">
                        <div className="subscription-date-tile rounded-2xl bg-violet-50 px-2 py-2.5 text-center text-violet-700">
                          <p className="text-[10px] font-bold uppercase tracking-wider">{getRenewalMonth(row.next_invoice_date)}</p>
                          <p className="mt-0.5 text-xl font-bold leading-none">{getRenewalDay(row.next_invoice_date)}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{String(row[titleKey] ?? "Untitled schedule")}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{String(row.customer_name ?? "Customer not set")}</p>
                        </div>
                        <p className="text-base font-semibold text-slate-950">{formatCurrencyAmount(Number(row[moneyKey ?? "amount"] ?? 0), currency, false, 2)}</p>
                        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold capitalize text-slate-600">{String(row.frequency ?? "Monthly")}</span>
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => void toggleSubscription(row)} className={`grid size-9 place-items-center rounded-xl ${active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`} aria-label={`${active ? "Pause" : "Activate"} ${String(row[titleKey] ?? "schedule")}`} title={active ? "Pause schedule" : "Activate schedule"}>{active ? <Pause size={15} /> : <Play size={15} />}</button>
                          <button type="button" onClick={() => void deleteRow(row.id)} className="grid size-9 place-items-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${String(row[titleKey] ?? "schedule")}`}><Trash2 size={15} /></button>
                        </div>
                      </article>
                    );
                  }) : <div className="grid min-h-52 place-items-center p-6 text-center text-sm text-slate-400">No renewal schedules match this view.</div>}
                </div>
              </section>

              <aside className="subscription-rhythm-panel self-start rounded-3xl bg-[#1f2937] p-5 text-white xl:sticky xl:top-24">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">Billing rhythm</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Revenue cadence</h3>
                <div className="mt-5 space-y-3">
                  {(["Monthly", "Quarterly", "Yearly"] as const).map((frequency) => {
                    const count = rows.filter((row) => String(row.frequency ?? "").toLowerCase() === frequency.toLowerCase()).length;
                    const width = rows.length ? Math.round((count / rows.length) * 100) : 0;
                    return <div key={frequency}><div className="flex justify-between text-xs"><span className="text-slate-300">{frequency}</span><span className="font-semibold text-white">{count}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-400" style={{ width: `${width}%` }} /></div></div>;
                  })}
                </div>
                <div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <p className="text-xs text-slate-400">Monthly run rate</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatCurrencyAmount(monthlyRecurring, currency)}</p>
                  <p className="mt-2 text-[11px] leading-5 text-slate-400">Normalized from active monthly, quarterly, and yearly schedules.</p>
                </div>
              </aside>
              {!isLoading && filteredRows.length ? <div className="xl:col-span-2"><PaginationControls currentPage={currentPage} pageCount={pageCount} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} /></div> : null}
            </div>
          ) : variant === "catalog" ? (
            <>
              <div className={`mt-5 grid gap-5 ${catalogType === "all" ? "xl:grid-cols-2" : "grid-cols-1"}`}>
                {catalogType !== "products" ? (
                  <CatalogShelf
                    title="Timed services"
                    description="Bookable offers with a set duration"
                    kind="service"
                    rows={catalogServices}
                    isLoading={isLoading}
                    currency={currency}
                    titleKey={titleKey}
                    moneyKey={moneyKey ?? "price"}
                    onToggle={(row) => void toggleCatalogAvailability(row)}
                    onDelete={(row) => void deleteRow(row.id)}
                  />
                ) : null}
                {catalogType !== "services" ? (
                  <CatalogShelf
                    title="Products & flat fees"
                    description="Items sold without a scheduled duration"
                    kind="product"
                    rows={catalogProducts}
                    isLoading={isLoading}
                    currency={currency}
                    titleKey={titleKey}
                    moneyKey={moneyKey ?? "price"}
                    onToggle={(row) => void toggleCatalogAvailability(row)}
                    onDelete={(row) => void deleteRow(row.id)}
                  />
                ) : null}
              </div>
              {!isLoading && filteredRows.length ? <PaginationControls currentPage={currentPage} pageCount={pageCount} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} /> : null}
            </>
          ) : variant === "schedule" ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setWeekStart((date) => addDays(date, -7))} className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100" aria-label="Previous week"><ChevronLeft size={17} /></button>
                <button type="button" onClick={() => setWeekStart(startOfWeek(new Date()))} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100">Today</button>
                <button type="button" onClick={() => setWeekStart((date) => addDays(date, 7))} className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100" aria-label="Next week"><ChevronRight size={17} /></button>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalendarDays size={16} className="text-slate-400" />
                {formatWeekRange(weekDays[0], weekDays[6])}
              </div>
            </div>
          ) : null}

          {variant === "team" ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" aria-label="Filter employees by status">
                {(["all", "active", "inactive"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => { setTeamStatus(status); setPage(1); }}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${teamStatus === status ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                    aria-pressed={teamStatus === status}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                Department
                <select value={teamDepartment} onChange={(event) => { setTeamDepartment(event.target.value); setPage(1); }} className="h-10 min-w-40 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100">
                  <option value="all">All departments</option>
                  {departments.map((department) => <option key={department} value={department}>{department}</option>)}
                </select>
              </label>
            </div>
          ) : null}

          {variant === "schedule" ? (
            <div className="mt-5 overflow-x-auto pb-2">
              <div className="grid min-w-[1050px] grid-cols-7 gap-3">
                {weekDays.map((day, dayIndex) => {
                  const dayKey = formatDateKey(day);
                  const shifts = filteredRows
                    .filter((row) => normalizeDateKey(row[dateKey ?? "work_date"]) === dayKey)
                    .sort((left, right) => String(left.start_time ?? "").localeCompare(String(right.start_time ?? "")));
                  const today = dayKey === formatDateKey(new Date());

                  return (
                    <section key={dayKey} className="schedule-day-column min-h-[26rem] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <header className={`border-b border-slate-200 px-3 py-3 ${today ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${today ? "text-slate-300" : "text-slate-400"}`}>{new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(day)}</p>
                        <div className="mt-1 flex items-end justify-between gap-2">
                          <p className="text-lg font-semibold">{day.getDate()}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${today ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"}`}>{shifts.length} shift{shifts.length === 1 ? "" : "s"}</span>
                        </div>
                      </header>
                      <div className="space-y-2 p-2.5">
                        {isLoading ? Array.from({ length: 2 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-200/70" />) : shifts.length ? shifts.map((row, shiftIndex) => (
                          <article key={String(row.id)} className={`schedule-shift-card rounded-xl border border-slate-200 border-l-4 bg-white p-3 shadow-sm ${shiftTones[(dayIndex + shiftIndex) % shiftTones.length]}`}>
                            <div className="flex items-start justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700"><Clock3 size={12} />{formatTimeValue(row.start_time)}–{formatTimeValue(row.end_time)}</span>
                              <button type="button" onClick={() => void deleteRow(row.id)} className="rounded-lg p-1 text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${String(row[titleKey] ?? "shift")}`}><Trash2 size={13} /></button>
                            </div>
                            <p className="mt-3 truncate text-sm font-semibold text-slate-950">{String(row[titleKey] ?? "Unassigned")}</p>
                            {row.location ? <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-slate-500"><MapPin size={12} className="shrink-0" />{String(row.location)}</p> : null}
                            {row.notes ? <p className="mt-2 line-clamp-2 border-t border-slate-100 pt-2 text-[11px] leading-4 text-slate-500">{String(row.notes)}</p> : null}
                          </article>
                        )) : (
                          <div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-slate-200 bg-white/60 px-3 text-center text-[11px] text-slate-400">No shifts</div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          ) : variant === "team" ? (
            <>
              <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {isLoading ? Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" role="status" aria-label="Loading employees" />
                )) : visibleRows.map((row) => {
                  const isActive = String(row.status ?? "").toLowerCase() === "active";
                  return (
                    <article key={String(row.id)} className="team-roster-card group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
                      <div className="relative bg-slate-900 p-5 text-white">
                        <div className="flex items-start justify-between gap-4">
                          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-sm font-bold ring-1 ring-white/15">{getInitials(row[titleKey])}</span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-slate-300"}`}>
                            <span className={`size-1.5 rounded-full ${isActive ? "bg-emerald-300" : "bg-slate-400"}`} />
                            {String(row.status ?? "Unknown")}
                          </span>
                        </div>
                        <h3 className="mt-4 truncate text-lg font-semibold text-white">{String(row[titleKey] ?? "Untitled")}</h3>
                        <p className="mt-1 truncate text-sm text-slate-300">{String(row.position ?? "Position not set")}</p>
                      </div>

                      <div className="space-y-4 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex min-w-0 items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            <BriefcaseBusiness size={13} />
                            <span className="truncate">{String(row.department ?? "No department")}</span>
                          </span>
                          {row.employee_code ? <span className="shrink-0 text-xs font-medium text-slate-400">#{String(row.employee_code)}</span> : null}
                        </div>
                        <div className="space-y-2 text-sm text-slate-600">
                          <p className="flex min-w-0 items-center gap-2"><Mail size={14} className="shrink-0 text-slate-400" /><span className="truncate">{String(row.email ?? "No email")}</span></p>
                          <p className="flex min-w-0 items-center gap-2"><Phone size={14} className="shrink-0 text-slate-400" /><span className="truncate">{String(row.phone ?? "No phone")}</span></p>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Salary</p>
                            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900"><BadgeDollarSign size={15} className="text-slate-400" />{formatCurrencyAmount(Number(row[moneyKey ?? "salary"] ?? 0), currency)}</p>
                          </div>
                          <button type="button" onClick={() => void deleteRow(row.id)} className="rounded-xl p-2.5 text-slate-400 opacity-70 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" aria-label={`Delete ${String(row[titleKey] ?? "employee")}`}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {!isLoading && filteredRows.length ? (
                <PaginationControls currentPage={currentPage} pageCount={pageCount} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} />
              ) : null}
            </>
          ) : variant === "directory" ? (
            <>
              <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                <table className="customer-directory-table w-full table-fixed border-collapse text-left">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="w-[24%] px-4 py-3">Customer</th>
                      <th className="w-[23%] px-4 py-3">Email</th>
                      <th className="w-[15%] px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Address</th>
                      <th className="w-28 px-4 py-3">Added</th>
                      <th className="w-24 px-3 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? Array.from({ length: 6 }, (_, index) => (
                      <tr key={index} className="animate-pulse" aria-label="Loading customer">
                        <td className="px-4 py-3"><div className="h-4 w-3/4 rounded bg-slate-100" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-4/5 rounded bg-slate-100" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-2/3 rounded bg-slate-100" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-5/6 rounded bg-slate-100" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-16 rounded bg-slate-100" /></td>
                        <td className="px-3 py-3" />
                      </tr>
                    )) : visibleRows.map((row) => (
                      <tr
                        key={String(row.id)}
                        tabIndex={0}
                        onClick={() => setSelectedRow(row)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedRow(row);
                          }
                        }}
                        className="group cursor-pointer bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400"
                        aria-label={`View ${String(row[titleKey] ?? "customer")} details`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 ring-1 ring-slate-200">{getInitials(row[titleKey])}</span>
                            <span className="truncate text-sm font-semibold text-slate-950">{String(row[titleKey] ?? "Untitled")}</span>
                          </div>
                        </td>
                        <td className="truncate px-4 py-3 text-sm text-slate-600" title={String(row.email ?? "")}>{String(row.email ?? "—")}</td>
                        <td className="truncate px-4 py-3 text-sm text-slate-600">{String(row.phone ?? "—")}</td>
                        <td className="truncate px-4 py-3 text-sm text-slate-600" title={String(row.address ?? "")}>{String(row.address ?? "—")}</td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-500">{formatRowDate(row.created_at)}</td>
                        <td className="px-3 py-3 text-right">
                          <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedRow(row); }} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label={`View ${String(row[titleKey] ?? "customer")} details`} title="View full details">
                            <ChevronRight size={16} />
                          </button>
                          <button type="button" onClick={(event) => { event.stopPropagation(); void deleteRow(row.id); }} className="rounded-lg p-2 text-slate-400 opacity-60 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" aria-label={`Delete ${String(row[titleKey] ?? "customer")}`}>
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-2 md:hidden">
                {isLoading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />) : visibleRows.map((row) => (
                  <article key={String(row.id)} role="button" tabIndex={0} onClick={() => setSelectedRow(row)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedRow(row); } }} className="customer-directory-mobile-card cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 ring-1 ring-slate-200">{getInitials(row[titleKey])}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-950">{String(row[titleKey] ?? "Untitled")}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{String(row.email ?? row.phone ?? "No contact details")}</p>
                        {row.address ? <p className="mt-2 line-clamp-1 text-xs text-slate-500">{String(row.address)}</p> : null}
                      </div>
                      <button type="button" onClick={(event) => { event.stopPropagation(); void deleteRow(row.id); }} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${String(row[titleKey] ?? "customer")}`}><Trash2 size={15} /></button>
                    </div>
                  </article>
                ))}
              </div>

              {!isLoading && filteredRows.length ? (
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-slate-500">
                    Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * directoryPageSize + 1}–{Math.min(currentPage * directoryPageSize, filteredRows.length)}</span> of <span className="font-semibold text-slate-700">{filteredRows.length}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={15} /> Previous</button>
                    <span className="min-w-16 text-center text-xs font-semibold text-slate-500">{currentPage} / {pageCount}</span>
                    <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next <ChevronRight size={15} /></button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className={`mt-5 grid gap-4 ${variant === "ledger" ? "lg:grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3"}`}>
              {isLoading ? Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4" role="status" aria-label="Loading records">
                  <div className="h-4 w-2/5 rounded-full bg-slate-200" />
                  <div className="mt-4 h-3 w-3/4 rounded-full bg-slate-200" />
                  <div className="mt-3 h-7 w-1/2 rounded-full bg-slate-200" />
                </div>
              )) : visibleRows.map((row) => (
                <article key={String(row.id)} className="rounded-2xl border border-slate-200 bg-[#f7fbff] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">{String(row[titleKey] ?? "Untitled")}</p>
                      {moneyKey ? <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">{formatCurrencyAmount(Number(row[moneyKey] ?? 0), currency)}</p> : null}
                      {dateKey && row[dateKey] ? <p className="mt-2 text-sm font-semibold text-blue-700">{String(row[dateKey])}</p> : null}
                    </div>
                    <button type="button" onClick={() => void deleteRow(row.id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50" aria-label="Delete record"><Trash2 size={15} /></button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {statusKey && row[statusKey] ? <Chip>{String(row[statusKey])}</Chip> : null}
                    {metaKeys.map((key) => row[key] ? <Chip key={key}>{String(row[key])}</Chip> : null)}
                  </div>
                </article>
              ))}
            </div>
          )}
          {variant !== "schedule" && variant !== "catalog" && variant !== "subscription" && variant !== "cashflow" && variant !== "expenses" && variant !== "payables" && variant !== "network" && variant !== "messages" && variant !== "permissions" && !isLoading && !filteredRows.length ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No records yet.
            </div>
          ) : null}
        </section>
      </section>

      {selectedRow ? (
        <div className="customer-details-overlay fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="customer-details-title">
          <button type="button" className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" onClick={() => setSelectedRow(null)} aria-label="Close customer details" />
          <aside className="customer-details-panel relative h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-700 ring-1 ring-slate-200">{getInitials(selectedRow[titleKey])}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{variant === "network" ? "Branch details" : "Customer details"}</p>
                  <h3 id="customer-details-title" className="mt-1 truncate text-xl font-semibold text-slate-950">{String(selectedRow[titleKey] ?? "Untitled")}</h3>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedRow(null)} className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close customer details"><X size={18} /></button>
            </div>

            <div className="space-y-6 p-6">
              <section className="grid gap-3 sm:grid-cols-2">
                {fields.filter((field) => field.name !== titleKey).map((field) => (
                  <DetailField
                    key={field.name}
                    label={field.label}
                    value={selectedRow[field.name]}
                    wide={field.name === "address" || field.type === "textarea"}
                  />
                ))}
              </section>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{variant === "network" ? "Connected to network" : "Added to directory"}</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{formatFullRowDate(selectedRow.created_at)}</p>
              </div>
              <p className="text-xs leading-5 text-slate-500">Click outside this panel or press Escape to close it.</p>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}

function getInitials(value: string | number | null) {
  const words = String(value ?? "?").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "?";
}

function PayablePressure({ icon: Icon, label, value, currency, tone }: { icon: typeof FileText; label: string; value: number; currency: string; tone: "danger" | "warning" | "success" }) {
  const toneClass = tone === "danger" ? "bg-red-50 text-red-700" : tone === "warning" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
  return <div className="flex items-center gap-3 border-b border-slate-200 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${toneClass}`}><Icon size={18} /></span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-semibold text-slate-950">{formatCurrencyAmount(value, currency)}</p></div></div>;
}

function MessageSignal({ label, value, tone }: { label: string; value: number; tone: "green" | "amber" | "blue" | "slate" }) {
  const tones = { green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", blue: "bg-sky-50 text-sky-700", slate: "bg-slate-100 text-slate-600" };
  return <div className={`rounded-2xl p-3 ${tones[tone]}`}><p className="text-[9px] font-semibold uppercase tracking-wide opacity-70">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>;
}

function SecurityCount({ label, value, tone }: { label: string; value: number; tone: "amber" | "red" | "blue" }) {
  const tones = { amber: "bg-amber-300/10 text-amber-200 ring-amber-300/15", red: "bg-red-300/10 text-red-200 ring-red-300/15", blue: "bg-blue-300/10 text-blue-200 ring-blue-300/15" };
  return <div className={`flex items-center justify-between rounded-2xl px-4 py-3 ring-1 ${tones[tone]}`}><span className="text-xs font-medium">{label}</span><span className="text-lg font-semibold text-white">{value}</span></div>;
}

function permissionAccessTone(value: string | number | null) {
  const access = String(value ?? "view").toLowerCase();
  if (access === "full") return "bg-red-50 text-red-700 ring-red-200";
  if (access === "edit") return "bg-violet-50 text-violet-700 ring-violet-200";
  if (access === "create") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-blue-50 text-blue-700 ring-blue-200";
}

function extractMessageVariables(message: string) {
  return Array.from(new Set(Array.from(message.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g), (match) => match[1].trim())));
}

function highlightTemplateMessage(message: string) {
  return message;
}

function RadarLine({ color, label, value, currency }: { color: string; label: string; value: number; currency: string }) {
  return <div className="flex items-center justify-between gap-3 text-xs"><span className="inline-flex items-center gap-2 text-blue-100"><span className={`size-2 rounded-full ${color}`} />{label}</span><span className="font-semibold text-white">{formatCurrencyAmount(value, currency)}</span></div>;
}

function normalizePayableStatus(value: string | number | null) {
  const status = String(value ?? "unpaid").toLowerCase();
  return status === "paid" || status === "pending" ? status : "unpaid";
}

function getPayableUrgency(row: Row) {
  if (normalizePayableStatus(row.payment_status) === "paid") return { key: "later", label: "Settled", className: "bg-emerald-50 text-emerald-700", borderClass: "border-l-emerald-400" };
  const dueDate = normalizeDateKey(row.due_date);
  if (!dueDate) return { key: "no-date", label: "No date", className: "bg-slate-100 text-slate-600", borderClass: "border-l-slate-300" };
  const today = formatDateKey(new Date());
  const days = Math.ceil((parseDateValue(dueDate).getTime() - parseDateValue(today).getTime()) / 86_400_000);
  if (days < 0) return { key: "overdue", label: `${Math.abs(days)}d late`, className: "bg-red-50 text-red-700", borderClass: "border-l-red-400" };
  if (days <= 7) return { key: "soon", label: days === 0 ? "Due today" : `${days}d left`, className: "bg-amber-50 text-amber-700", borderClass: "border-l-amber-400" };
  return { key: "later", label: "Scheduled", className: "bg-blue-50 text-blue-700", borderClass: "border-l-blue-400" };
}

function calculatePayableTotals(rows: Row[]): PayableTotals {
  return rows.reduce<PayableTotals>((totals, row) => {
    const amount = Number(row.total_amount ?? 0);
    if (normalizePayableStatus(row.payment_status) === "paid") {
      totals.paid += amount;
      return totals;
    }
    totals.outstanding += amount;
    const urgency = getPayableUrgency(row).key;
    if (urgency === "overdue") totals.overdue += amount;
    if (urgency === "soon") totals.dueSoon += amount;
    return totals;
  }, { outstanding: 0, overdue: 0, dueSoon: 0, paid: 0 });
}

function comparePayableDueDates(first: Row, second: Row) {
  const firstDate = normalizeDateKey(first.due_date) || "9999-12-31";
  const secondDate = normalizeDateKey(second.due_date) || "9999-12-31";
  return firstDate.localeCompare(secondDate);
}

function normalizeCategory(value: string | number | null) {
  return String(value ?? "Uncategorized").trim().toLowerCase() || "uncategorized";
}

function groupExpensesByCategory(rows: Row[]) {
  const groups = new Map<string, Row[]>();
  rows.forEach((row) => {
    const category = normalizeCategory(row.category);
    groups.set(category, [...(groups.get(category) ?? []), row]);
  });
  return Array.from(groups.entries()).sort((first, second) => {
    const firstTotal = first[1].reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const secondTotal = second[1].reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    return secondTotal - firstTotal;
  });
}

function expenseCategoryTotal(rows: Row[], category: string) {
  return rows.filter((row) => normalizeCategory(row.category) === category).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

function expenseSegmentTone(index: number) {
  return ["bg-rose-400", "bg-orange-400", "bg-amber-300", "bg-fuchsia-400", "bg-sky-400", "bg-violet-400"][index % 6];
}

function expenseCategoryTone(index: number) {
  return ["bg-rose-100 text-rose-700", "bg-orange-100 text-orange-700", "bg-amber-100 text-amber-700", "bg-fuchsia-100 text-fuchsia-700", "bg-sky-100 text-sky-700", "bg-violet-100 text-violet-700"][index % 6];
}

function isCurrentMonth(value: string | number | null) {
  if (!value) return false;
  const date = parseDateValue(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function getPaymentMethodIcon(value: string | number | null) {
  const method = String(value ?? "").toLowerCase();
  if (method === "card" || method === "online") return CreditCard;
  if (method === "cash") return Banknote;
  return WalletCards;
}

function formatPaymentDate(value: string | number | null) {
  if (!value) return "Date not set";
  const date = parseDateValue(value);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function monthlyEquivalent(row: Row) {
  const amount = Number(row.amount ?? 0);
  const frequency = String(row.frequency ?? "monthly").toLowerCase();
  if (frequency === "yearly") return amount / 12;
  if (frequency === "quarterly") return amount / 3;
  return amount;
}

function findNextRenewal(rows: Row[]) {
  const today = formatDateKey(new Date());
  return rows
    .filter((row) => String(row.status ?? "").toLowerCase() === "active")
    .map((row) => normalizeDateKey(row.next_invoice_date))
    .filter((value) => value && value >= today)
    .sort()[0] ?? null;
}

function compareRenewalDates(first: Row, second: Row) {
  const firstDate = normalizeDateKey(first.next_invoice_date) || "9999-12-31";
  const secondDate = normalizeDateKey(second.next_invoice_date) || "9999-12-31";
  return firstDate.localeCompare(secondDate);
}

function getRenewalMonth(value: string | number | null) {
  const date = parseDateValue(value);
  return value ? new Intl.DateTimeFormat(undefined, { month: "short" }).format(date) : "TBD";
}

function getRenewalDay(value: string | number | null) {
  return value ? String(parseDateValue(value).getDate()) : "—";
}

function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(parseDateValue(value));
}

function startOfWeek(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return date;
}

function addDays(value: Date, amount: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function parseDateValue(value: string | number | null) {
  const [year, month, day] = String(value ?? "").slice(0, 10).split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : new Date();
}

function formatDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateKey(value: string | number | null) {
  return String(value ?? "").slice(0, 10);
}

function formatWeekRange(start: Date, end: Date) {
  const startLabel = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(start);
  const endLabel = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(end);
  return `${startLabel} – ${endLabel}`;
}

function timeToMinutes(value: string | number | null) {
  const [hours, minutes] = String(value ?? "").split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
}

function getShiftHours(start: string | number | null, end: string | number | null) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes === null || endMinutes === null) return 0;
  const duration = endMinutes >= startMinutes ? endMinutes - startMinutes : endMinutes + 24 * 60 - startMinutes;
  return duration / 60;
}

function formatTimeValue(value: string | number | null) {
  const minutes = timeToMinutes(value);
  if (minutes === null) return "—";
  const date = new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatRowDate(value: string | number | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "2-digit" }).format(date);
}

function formatFullRowDate(value: string | number | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(date);
}

function DetailField({ label, value, wide = false }: { label: string; value: string | number | null; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{String(value ?? "").trim() || "Not provided"}</p>
    </div>
  );
}

function CatalogShelf({
  title,
  description,
  kind,
  rows,
  isLoading,
  currency,
  titleKey,
  moneyKey,
  onToggle,
  onDelete,
}: {
  title: string;
  description: string;
  kind: "service" | "product";
  rows: Row[];
  isLoading: boolean;
  currency: string;
  titleKey: string;
  moneyKey: string;
  onToggle: (row: Row) => void;
  onDelete: (row: Row) => void;
}) {
  const Icon = kind === "service" ? Timer : Package;

  return (
    <section className="catalog-shelf overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${kind === "service" ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700"}`}><Icon size={18} /></span>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-950">{title}</h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{rows.length}</span>
      </header>

      <div className="divide-y divide-slate-100">
        {isLoading ? Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex animate-pulse items-center gap-3 px-5 py-4">
            <div className="size-10 rounded-xl bg-slate-100" />
            <div className="flex-1"><div className="h-4 w-2/5 rounded bg-slate-100" /><div className="mt-2 h-3 w-3/5 rounded bg-slate-100" /></div>
            <div className="h-6 w-16 rounded bg-slate-100" />
          </div>
        )) : rows.length ? rows.map((row) => {
          const active = String(row.status ?? "").toLowerCase() === "active";
          return (
            <article key={String(row.id)} className="catalog-item-row flex flex-col gap-3 bg-white px-5 py-4 sm:flex-row sm:items-center">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${kind === "service" ? "bg-violet-50 text-violet-600" : "bg-amber-50 text-amber-600"}`}><Icon size={17} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950">{String(row[titleKey] ?? "Untitled")}</p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">{String(row.description ?? "No description")}</p>
              </div>
              {kind === "service" ? <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">{formatDuration(row.duration_minutes)}</span> : null}
              <p className="min-w-20 shrink-0 text-left text-base font-semibold text-slate-950 sm:text-right">{formatCurrencyAmount(Number(row[moneyKey] ?? 0), currency, false, 2)}</p>
              <button type="button" onClick={() => onToggle(row)} className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`} aria-label={`${active ? "Make unavailable" : "Make available"}: ${String(row[titleKey] ?? "item")}`}>
                <span className={`size-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />{active ? "Available" : "Hidden"}
              </button>
              <button type="button" onClick={() => onDelete(row)} className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${String(row[titleKey] ?? "item")}`}><Trash2 size={15} /></button>
            </article>
          );
        }) : (
          <div className="grid min-h-40 place-items-center px-5 text-center text-sm text-slate-400">No items in this section</div>
        )}
      </div>
    </section>
  );
}

function formatDuration(value: string | number | null) {
  const minutes = Number(value ?? 0);
  if (!minutes) return "No duration";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function PaginationControls({
  currentPage,
  pageCount,
  pageSize,
  total,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-slate-500">
        Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)}</span> of <span className="font-semibold text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={15} /> Previous</button>
        <span className="min-w-16 text-center text-xs font-semibold text-slate-500">{currentPage} / {pageCount}</span>
        <button type="button" onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))} disabled={currentPage === pageCount} className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next <ChevronRight size={15} /></button>
      </div>
    </div>
  );
}

function FieldInput({ field, compact = false }: { field: Field; compact?: boolean }) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700">{field.label}</span>
      {field.type === "textarea" ? (
        <textarea name={field.name} required={field.required} rows={compact ? 2 : 4} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
      ) : field.type === "select" ? (
        <select name={field.name} required={field.required} defaultValue={field.options?.[0]?.toLowerCase() ?? ""} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm capitalize outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
          {field.options?.map((option) => <option key={option} value={option.toLowerCase()}>{option}</option>)}
        </select>
      ) : (
        <input name={field.name} type={field.type ?? "text"} step={field.type === "number" ? "any" : undefined} required={field.required} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
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
