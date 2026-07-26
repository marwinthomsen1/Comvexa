"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarCheck2, CheckCircle2 } from "lucide-react";

type BookingData = {
  company?: { name?: string };
  services: Array<{ id: string; name: string; price: number | null; duration_minutes: number | null }>;
  settings: { depositType: string; depositAmount: number; cancellationHours: number };
};

export function PublicBookingForm({ slug }: { slug: string }) {
  const [data, setData] = useState<BookingData | null>(null);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch(`/api/public/booking/${encodeURIComponent(slug)}`).then(async (response) => {
      const result = await response.json();
      if (!response.ok) setError(result.error);
      else setData(result);
    });
  }, [slug]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(`/api/public/booking/${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) setError(result.error ?? "Could not create booking.");
    else setSent(true);
  }

  return (
    <main className="min-h-screen bg-[#f5f2e9] p-4 sm:p-8">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        <header className="bg-[#073f47] p-6 text-white">
          <CalendarCheck2 size={28} className="text-[#8ce5d4]" />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#8ce5d4]">Online booking</p>
          <h1 className="mt-2 text-3xl font-semibold">{data?.company?.name ?? "Book an appointment"}</h1>
        </header>
        {sent ? (
          <div className="grid min-h-96 place-items-center p-8 text-center">
            <div><CheckCircle2 size={48} className="mx-auto text-emerald-600" /><h2 className="mt-4 text-2xl font-semibold text-slate-950">Booking received</h2><p className="mt-2 text-slate-500">Check your email for confirmation.</p></div>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 p-6 sm:grid-cols-2">
            <label><span className="text-sm font-medium">Name</span><input name="customerName" required className={inputClass} /></label>
            <label><span className="text-sm font-medium">Email</span><input name="customerEmail" type="email" required className={inputClass} /></label>
            <label><span className="text-sm font-medium">Phone</span><input name="customerPhone" type="tel" className={inputClass} /></label>
            <label><span className="text-sm font-medium">Service</span><select name="serviceId" className={inputClass}><option value="">General appointment</option>{data?.services.map((service) => <option key={service.id} value={service.id}>{service.name}{service.price ? ` · ${service.price}` : ""}</option>)}</select></label>
            <label><span className="text-sm font-medium">Date</span><input name="bookingDate" type="date" min={new Date().toISOString().slice(0, 10)} required className={inputClass} /></label>
            <label><span className="text-sm font-medium">Time</span><input name="startTime" type="time" required className={inputClass} /></label>
            <label className="sm:col-span-2"><span className="text-sm font-medium">Notes</span><textarea name="notes" rows={3} className={`${inputClass} h-auto py-3`} /></label>
            {data && data.settings.depositType !== "none" ? <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 sm:col-span-2">A {data.settings.depositType} deposit of {data.settings.depositAmount} is required. Cancellation notice: {data.settings.cancellationHours} hours.</p> : null}
            {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p> : null}
            <button disabled={saving || !data} className="h-12 rounded-xl bg-[#ff7356] font-semibold text-white sm:col-span-2">{saving ? "Booking…" : "Request booking"}</button>
          </form>
        )}
        <footer className="p-4 text-center text-[10px] font-semibold text-slate-400">Made with Comvexa.net</footer>
      </section>
    </main>
  );
}

const inputClass = "mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";
