"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Boxes, Factory, PackageOpen, PackagePlus, Search, Trash2, Warehouse, X } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
import { PlanGate } from "../_components/plan-gate";

type InventoryItem = {
  id: string;
  company_id: string;
  name: string | null;
  quantity: number | null;
  unit: string | null;
  low_stock_alert: number | null;
  supplier: string | null;
  created_at: string | null;
};

const pageSize = 25;

export default function InventoryPage() {
  return <PlanGate moduleName="Inventory"><InventoryWarehouse /></PlanGate>;
}

function InventoryWarehouse() {
  const [companyId, setCompanyId] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<"all" | "low" | "healthy">("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());

  async function loadItems() {
    setError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setError("You must be logged in to view inventory.");
      setIsLoading(false);
      return;
    }
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) {
      setError("Your profile is not connected to a company yet.");
      setIsLoading(false);
      return;
    }
    setCompanyId(profile.company_id);
    const { data, error: itemsError } = await supabase.from("inventory_items").select("*").eq("company_id", profile.company_id).order("name", { ascending: true });
    if (itemsError) setError(itemsError.message);
    else setItems((data ?? []) as InventoryItem[]);
    setIsLoading(false);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadItems(), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!showForm) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setShowForm(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showForm]);

  const lowStockItems = useMemo(() => items.filter(isLowStock), [items]);
  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const low = isLowStock(item);
      const matchesFilter = filter === "all" || (filter === "low" ? low : !low);
      const matchesSearch = !term || [item.name, item.supplier, item.unit].some((value) => String(value ?? "").toLowerCase().includes(term));
      return matchesFilter && matchesSearch;
    });
  }, [filter, items, search]);
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
  const supplierCount = new Set(items.map((item) => String(item.supplier ?? "").trim()).filter(Boolean)).size;
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId) {
      setError("Your company workspace is not ready yet.");
      return;
    }
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      company_id: companyId,
      name: String(formData.get("name") ?? "").trim(),
      quantity: Number(formData.get("quantity") ?? 0),
      unit: String(formData.get("unit") ?? "").trim() || null,
      low_stock_alert: Number(formData.get("low_stock_alert") ?? 0),
      supplier: String(formData.get("supplier") ?? "").trim() || null,
    };
    const { data, error: insertError } = await supabase.from("inventory_items").insert(payload).select("*").single();
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setItems((current) => [...current, data as InventoryItem].sort((first, second) => String(first.name).localeCompare(String(second.name))));
    form.reset();
    setShowForm(false);
    setPage(1);
  }

  async function adjustQuantity(item: InventoryItem, delta: number) {
    if (pendingIds.has(item.id)) return;
    const previousQuantity = Number(item.quantity ?? 0);
    const nextQuantity = Math.max(0, previousQuantity + delta);
    setPendingIds((current) => new Set(current).add(item.id));
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, quantity: nextQuantity } : entry));
    const { error: updateError } = await supabase.from("inventory_items").update({ quantity: nextQuantity }).eq("id", item.id);
    if (updateError) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, quantity: previousQuantity } : entry));
      setError(updateError.message);
    }
    setPendingIds((current) => { const next = new Set(current); next.delete(item.id); return next; });
  }

  async function deleteItem(item: InventoryItem) {
    const previousItems = items;
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    const { error: deleteError } = await supabase.from("inventory_items").delete().eq("id", item.id);
    if (deleteError) {
      setItems(previousItems);
      setError(deleteError.message);
    }
  }

  return (
    <main className="inventory-warehouse-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="dashboard-custom-hero inventory-warehouse-header overflow-hidden rounded-[2rem] border border-[#39434d] bg-[#202830] p-6 text-white shadow-xl shadow-slate-950/10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="flex items-center gap-2 text-[#f5c84c]"><Warehouse size={17} /><p className="text-xs font-semibold uppercase tracking-[0.19em]">Warehouse operations</p></div><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Inventory floor</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Read stock like a warehouse rack, identify empty bays, and adjust quantities without waiting for the page to reload.</p></div>
          <button type="button" onClick={() => setShowForm(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f5c84c] px-4 text-sm font-semibold text-[#202830] hover:bg-[#ffda6e]"><PackagePlus size={17} />Add stock item</button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <WarehouseMetric label="Stock lines" value={String(items.length)} icon={Boxes} />
          <WarehouseMetric label="Units on hand" value={String(totalQuantity)} icon={PackageOpen} />
          <WarehouseMetric label="Reorder queue" value={String(lowStockItems.length)} icon={AlertTriangle} alert={lowStockItems.length > 0} />
          <WarehouseMetric label="Suppliers" value={String(supplierCount)} icon={Factory} />
        </div>
      </section>

      {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="inventory-rack rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Rack overview</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Stock bays</h3></div><div className="flex flex-col gap-2 sm:flex-row"><label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-500 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-100 sm:w-64"><Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search stock" className="min-w-0 flex-1 bg-transparent outline-none" /></label><div className="inline-flex rounded-xl bg-slate-100 p-1">{(["all", "low", "healthy"] as const).map((option) => <button key={option} type="button" onClick={() => { setFilter(option); setPage(1); }} aria-pressed={filter === option} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${filter === option ? "bg-[#202830] text-white" : "text-slate-500 hover:bg-white"}`}>{option}</button>)}</div></div></div>

          <div className="inventory-rack-frame mt-5 overflow-hidden rounded-3xl border-[6px] border-[#47515a] bg-[#47515a] shadow-inner">
            <div className="hidden grid-cols-[minmax(170px,1.2fr)_minmax(170px,1fr)_120px_190px_86px] gap-4 bg-[#303941] px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-300 md:grid"><span>Stock item</span><span>Level</span><span>Supplier</span><span>Quantity control</span><span /></div>
            <div className="space-y-1 bg-[#47515a]">
              {isLoading ? Array.from({ length: 6 }, (_, index) => <div key={index} className="h-20 animate-pulse bg-slate-100" />) : pageItems.length ? pageItems.map((item, index) => {
                const low = isLowStock(item);
                const quantity = Number(item.quantity ?? 0);
                const threshold = Number(item.low_stock_alert ?? 0);
                const capacity = Math.max(threshold * 3, quantity, 1);
                const fill = Math.min(100, Math.round((quantity / capacity) * 100));
                const pending = pendingIds.has(item.id);
                return <article key={item.id} className="inventory-bay-row grid gap-4 bg-white p-4 md:grid-cols-[minmax(170px,1.2fr)_minmax(170px,1fr)_120px_190px_86px] md:items-center"><div className="flex min-w-0 items-center gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-xl font-mono text-xs font-bold ${low ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{String((currentPage - 1) * pageSize + index + 1).padStart(2, "0")}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{item.name || "Unnamed stock"}</p><p className="mt-1 text-xs text-slate-400">Alert at {threshold} {item.unit || "units"}</p></div></div><div><div className="flex items-center justify-between gap-3 text-xs"><span className={`font-semibold ${low ? "text-amber-700" : "text-slate-600"}`}>{low ? "Reorder" : "Stocked"}</span><span className="text-slate-400">{fill}% bay</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-sm bg-slate-100"><div className={`h-full ${low ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${fill}%` }} /></div></div><p className="truncate text-xs font-medium text-slate-600">{item.supplier || "No supplier"}</p><div className="flex items-center gap-2"><button type="button" disabled={pending || quantity === 0} onClick={() => void adjustQuantity(item, -1)} className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-35" aria-label={`Remove one ${item.name}`}><ArrowDown size={14} /></button><div className="min-w-20 flex-1 text-center"><span className="text-lg font-bold text-slate-950">{quantity}</span><span className="ml-1 text-xs text-slate-400">{item.unit}</span></div><button type="button" disabled={pending} onClick={() => void adjustQuantity(item, 1)} className="grid size-9 place-items-center rounded-xl bg-[#202830] text-white hover:bg-[#35414b] disabled:opacity-50" aria-label={`Add one ${item.name}`}><ArrowUp size={14} /></button><button type="button" disabled={pending} onClick={() => void adjustQuantity(item, 10)} className="h-9 rounded-xl bg-amber-100 px-2 text-[10px] font-bold text-amber-800 hover:bg-amber-200 disabled:opacity-50">+10</button></div><button type="button" onClick={() => void deleteItem(item)} className="justify-self-end rounded-xl p-2.5 text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${item.name}`}><Trash2 size={15} /></button></article>;
              }) : <div className="grid min-h-72 place-items-center bg-white p-8 text-center"><div><PackageOpen size={38} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No stock bays in this view</p><p className="mt-1 text-sm text-slate-500">Add an item or change the current filter.</p></div></div>}
            </div>
          </div>
          {!isLoading && visibleItems.length ? <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm"><p className="text-slate-500">Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visibleItems.length)}</span> of {visibleItems.length}</p><div className="flex gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="h-9 rounded-xl border border-slate-200 px-3 font-semibold text-slate-600 disabled:opacity-40">Previous</button><button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} className="h-9 rounded-xl border border-slate-200 px-3 font-semibold text-slate-600 disabled:opacity-40">Next</button></div></div> : null}
        </div>

        <aside className="inventory-reorder-panel self-start rounded-[2rem] border border-amber-200 bg-[#fff9e8] p-5 shadow-sm xl:sticky xl:top-24"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Reorder queue</p><h3 className="mt-2 text-lg font-semibold text-slate-950">Stock attention</h3></div><AlertTriangle size={21} className="text-amber-600" /></div><div className="mt-5 space-y-2">{lowStockItems.length ? lowStockItems.slice(0, 8).map((item) => <button key={item.id} type="button" onClick={() => { setSearch(String(item.name ?? "")); setFilter("all"); setPage(1); }} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-white p-3 text-left hover:border-amber-300"><span className="min-w-0"><span className="block truncate text-xs font-semibold text-slate-800">{item.name}</span><span className="mt-1 block truncate text-[10px] text-slate-400">{item.supplier || "Supplier not assigned"}</span></span><span className="shrink-0 rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">{Number(item.quantity ?? 0)} {item.unit}</span></button>) : <div className="rounded-2xl border border-emerald-100 bg-white p-5 text-center"><Boxes size={25} className="mx-auto text-emerald-500" /><p className="mt-2 text-sm font-semibold text-emerald-800">All bays healthy</p></div>}</div>{lowStockItems.length > 8 ? <p className="mt-4 text-center text-xs text-amber-700">+{lowStockItems.length - 8} more low-stock items</p> : null}</aside>
      </section>

      {showForm ? <div className="inventory-form-overlay fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="inventory-form-title"><button type="button" onClick={() => setShowForm(false)} className="absolute inset-0 bg-[#171d22]/65 backdrop-blur-sm" aria-label="Close stock form" /><form onSubmit={addItem} className="inventory-stock-form relative w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Warehouse intake</p><h3 id="inventory-form-title" className="mt-2 text-2xl font-semibold text-slate-950">Add stock item</h3></div><button type="button" onClick={() => setShowForm(false)} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close stock form"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="text-sm font-medium text-slate-700">Item name</span><input name="name" required placeholder="Item name" className="inventory-input" /></label><InventoryInput name="quantity" label="Opening quantity" type="number" /><InventoryInput name="unit" label="Unit" /><InventoryInput name="low_stock_alert" label="Reorder alert" type="number" /><InventoryInput name="supplier" label="Supplier" /><button disabled={!companyId} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#202830] px-4 text-sm font-semibold text-white hover:bg-[#35414b] disabled:opacity-50 sm:col-span-2"><PackagePlus size={17} />Place on rack</button></div></form></div> : null}
    </main>
  );
}

function WarehouseMetric({ label, value, icon: Icon, alert = false }: { label: string; value: string; icon: typeof Boxes; alert?: boolean }) {
  return <div className={`rounded-2xl border px-4 py-3 ${alert ? "border-amber-300/30 bg-amber-300/10" : "border-white/10 bg-white/[0.06]"}`}><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">{label}</p><Icon size={15} className={alert ? "text-amber-300" : "text-[#f5c84c]"} /></div><p className={`mt-2 text-xl font-semibold ${alert ? "text-amber-100" : "text-white"}`}>{value}</p></div>;
}

function InventoryInput({ name, label, type = "text" }: { name: string; label: string; type?: "text" | "number" }) {
  return <label><span className="text-sm font-medium text-slate-700">{label}</span><input name={name} type={type} step={type === "number" ? "any" : undefined} className="inventory-input" /></label>;
}

function isLowStock(item: InventoryItem) {
  return Number(item.quantity ?? 0) <= Number(item.low_stock_alert ?? 0);
}
