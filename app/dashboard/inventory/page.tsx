"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, PackagePlus, Trash2, TrendingDown } from "lucide-react";
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

export default function InventoryPage() {
  return (
    <PlanGate moduleName="Inventory">
      <InventoryBoard />
    </PlanGate>
  );
}

function InventoryBoard() {
  const [companyId, setCompanyId] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<"all" | "low" | "healthy">("all");
  const [error, setError] = useState("");

  async function loadItems() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setError("You must be logged in to view inventory.");
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();

    if (!profile?.company_id) {
      setError("Your profile is not connected to a company yet.");
      return;
    }

    setCompanyId(profile.company_id);
    const { data, error: itemsError } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("name", { ascending: true });

    if (itemsError) {
      setError(itemsError.message);
      return;
    }

    setItems((data ?? []) as InventoryItem[]);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadItems(), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const lowStockItems = useMemo(
    () => items.filter((item) => Number(item.quantity ?? 0) <= Number(item.low_stock_alert ?? 0)),
    [items],
  );
  const healthyItems = items.filter((item) => !lowStockItems.some((low) => low.id === item.id));
  const visibleItems = filter === "low" ? lowStockItems : filter === "healthy" ? healthyItems : items;
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!companyId) {
      setError("Your company workspace is not ready yet.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const { error: insertError } = await supabase.from("inventory_items").insert({
      company_id: companyId,
      name: String(formData.get("name") ?? "").trim(),
      quantity: Number(formData.get("quantity") ?? 0),
      unit: String(formData.get("unit") ?? "").trim() || null,
      low_stock_alert: Number(formData.get("low_stock_alert") ?? 0),
      supplier: String(formData.get("supplier") ?? "").trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    event.currentTarget.reset();
    await loadItems();
  }

  async function adjustQuantity(item: InventoryItem, delta: number) {
    const nextQuantity = Math.max(0, Number(item.quantity ?? 0) + delta);
    const { error: updateError } = await supabase.from("inventory_items").update({ quantity: nextQuantity }).eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadItems();
  }

  async function deleteItem(id: string) {
    const { error: deleteError } = await supabase.from("inventory_items").delete().eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadItems();
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Stock control</p>
        <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-normal text-slate-950">Inventory</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Monitor stock levels, spot low inventory, and adjust quantities directly from item cards.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="Items" value={String(items.length)} />
            <Metric label="Low stock" value={String(lowStockItems.length)} />
            <Metric label="Units" value={String(totalQuantity)} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={addItem} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <h3 className="font-semibold text-slate-950">Add stock item</h3>
          <div className="mt-5 grid gap-4">
            <input name="name" required placeholder="Item name" className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
            <div className="grid grid-cols-2 gap-3">
              <input name="quantity" type="number" placeholder="Quantity" className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
              <input name="unit" placeholder="Unit" className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
            </div>
            <input name="low_stock_alert" type="number" placeholder="Low stock alert" className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
            <input name="supplier" placeholder="Supplier" className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
            {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">{error}</p> : null}
            <button disabled={!companyId} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300">
              <PackagePlus size={17} />
              Add item
            </button>
          </div>
        </form>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-slate-950">Stock board</h3>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(["all", "low", "healthy"] as const).map((option) => (
                <button key={option} type="button" onClick={() => setFilter(option)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${filter === option ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => {
              const low = Number(item.quantity ?? 0) <= Number(item.low_stock_alert ?? 0);

              return (
                <article key={item.id} className={`rounded-2xl border p-4 shadow-sm ${low ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-[#f7fbff]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{item.name}</p>
                      <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">{Number(item.quantity ?? 0)} <span className="text-sm font-medium text-slate-500">{item.unit}</span></p>
                    </div>
                    <button onClick={() => void deleteItem(item.id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50" aria-label="Delete item">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">
                      <Boxes size={13} />
                      Alert at {Number(item.low_stock_alert ?? 0)}
                    </span>
                    {low ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-amber-700 ring-1 ring-amber-200">
                        <AlertTriangle size={13} />
                        Low stock
                      </span>
                    ) : null}
                    {item.supplier ? <span className="rounded-full bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">{item.supplier}</span> : null}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => void adjustQuantity(item, -1)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">-1</button>
                    <button type="button" onClick={() => void adjustQuantity(item, 1)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">+1</button>
                    <button type="button" onClick={() => void adjustQuantity(item, 10)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">+10</button>
                  </div>
                </article>
              );
            })}
          </div>
          {!visibleItems.length ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              <TrendingDown className="mx-auto text-slate-400" size={26} />
              <p className="mt-3 font-semibold text-slate-950">No stock items in this view</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
