"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Edit3, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
import { PlanGate } from "../_components/plan-gate";

type Booking = {
  id: string;
  company_id: string;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function timeLabel(time: string | null) {
  return time ? time.slice(0, 5) : "Any time";
}

function buildCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export default function BookingsPage() {
  return (
    <PlanGate moduleName="Bookings">
      <BookingsCalendar />
    </PlanGate>
  );
}

function BookingsCalendar() {
  const todayKey = toDateKey(new Date());
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [companyId, setCompanyId] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadBookings() {
    setError("");
    setIsLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setError("You must be logged in to view bookings.");
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
      .from("bookings")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("booking_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (rowsError) {
      setError(rowsError.message);
      setIsLoading(false);
      return;
    }

    setBookings((data ?? []) as Booking[]);
    setIsLoading(false);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadBookings(), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const days = useMemo(() => buildCalendarDays(month), [month]);
  const bookingsByDate = useMemo(() => {
    return bookings.reduce<Record<string, Booking[]>>((groups, booking) => {
      const key = booking.booking_date ?? "";
      groups[key] = [...(groups[key] ?? []), booking];
      return groups;
    }, {});
  }, [bookings]);
  const selectedBookings = bookingsByDate[selectedDate] ?? [];
  const monthBookings = bookings.filter((booking) => {
    if (!booking.booking_date) {
      return false;
    }

    const bookingDate = new Date(booking.booking_date);
    return bookingDate.getMonth() === month.getMonth() && bookingDate.getFullYear() === month.getFullYear();
  });
  const upcomingCount = bookings.filter((booking) => (booking.booking_date ?? "") >= todayKey).length;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!companyId) {
      setError("Your company workspace is not ready yet.");
      return;
    }

    setIsSaving(true);
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      company_id: companyId,
      booking_date: String(formData.get("booking_date") ?? selectedDate),
      start_time: String(formData.get("start_time") ?? "") || null,
      end_time: String(formData.get("end_time") ?? "") || null,
      status: String(formData.get("status") ?? "pending"),
      notes: String(formData.get("notes") ?? "").trim() || null,
    };

    const request = editingBooking
      ? supabase.from("bookings").update(payload).eq("id", editingBooking.id)
      : supabase.from("bookings").insert(payload);
    const { error: saveError } = await request;

    setIsSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setEditingBooking(null);
    form.reset();
    await loadBookings();
  }

  async function deleteBooking(id: string) {
    const { error: deleteError } = await supabase.from("bookings").delete().eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadBookings();
  }

  function moveMonth(delta: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Booking calendar</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">Bookings</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Schedule appointments from a calendar view, open any day, and manage the booking list without hunting through a table.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-2 text-center text-sm">
            <Metric label="This month" value={String(monthBookings.length)} />
            <Metric label="Selected day" value={String(selectedBookings.length)} />
            <Metric label="Upcoming" value={String(upcomingCount)} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <CalendarDays size={21} />
              </span>
              <div>
                <h3 className="text-xl font-semibold tracking-normal text-slate-950">{monthLabel(month)}</h3>
                <p className="text-sm text-slate-500">{isLoading ? "Loading bookings..." : `${bookings.length} total bookings`}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => moveMonth(-1)} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Previous month">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => { setMonth(new Date()); setSelectedDate(todayKey); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Today
              </button>
              <button type="button" onClick={() => moveMonth(1)} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Next month">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="dashboard-calendar-scroll mt-5 overflow-x-auto pb-2 [scrollbar-width:thin]">
          <div className="grid min-w-[42rem] grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-widest text-slate-400 sm:min-w-0">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-2 grid min-w-[42rem] grid-cols-7 gap-2 sm:min-w-0">
            {days.map((date) => {
              const key = toDateKey(date);
              const dayBookings = bookingsByDate[key] ?? [];
              const selected = selectedDate === key;
              const inMonth = date.getMonth() === month.getMonth();
              const isToday = key === todayKey;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  aria-label={date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  aria-pressed={selected}
                  className={`min-h-28 rounded-2xl border p-2 text-left transition ${
                    selected
                      ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100"
                      : inMonth
                        ? "border-slate-200 bg-white hover:bg-slate-50"
                        : "border-slate-100 bg-slate-50/60 text-slate-400"
                  }`}
                >
                  <span className={`inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold ${isToday ? "bg-emerald-600 text-white" : "text-slate-700"}`}>
                    {date.getDate()}
                  </span>
                  <div className="mt-2 space-y-1">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <span key={booking.id} className="block truncate rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                        {timeLabel(booking.start_time)} {booking.notes ?? "Booking"}
                      </span>
                    ))}
                    {dayBookings.length > 3 ? (
                      <span className="block text-[11px] font-semibold text-slate-500">+{dayBookings.length - 3} more</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
          </div>
        </div>

        <aside className="min-w-0 space-y-6">
          <form key={editingBooking?.id ?? selectedDate} onSubmit={handleSave} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-950">{editingBooking ? "Edit booking" : "Add booking"}</h3>
                <p className="mt-1 text-sm text-slate-500">{new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
              </div>
              {editingBooking ? (
                <button type="button" onClick={() => setEditingBooking(null)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Cancel edit">
                  <X size={17} />
                </button>
              ) : null}
            </div>
            <div className="mt-5 grid gap-4">
              <label>
                <span className="text-sm font-medium text-slate-700">Date</span>
                <input name="booking_date" type="date" required defaultValue={editingBooking?.booking_date ?? selectedDate} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="text-sm font-medium text-slate-700">Start</span>
                  <input name="start_time" type="time" defaultValue={editingBooking?.start_time ?? ""} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
                </label>
                <label>
                  <span className="text-sm font-medium text-slate-700">End</span>
                  <input name="end_time" type="time" defaultValue={editingBooking?.end_time ?? ""} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
                </label>
              </div>
              <label>
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select name="status" defaultValue={editingBooking?.status ?? "pending"} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm capitalize outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100">
                  {["pending", "confirmed", "completed", "cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Booking notes</span>
                <textarea name="notes" rows={4} defaultValue={editingBooking?.notes ?? ""} placeholder="Customer, service, location, or booking details" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
              </label>
              {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100" role="alert">{error}</p> : null}
              <button type="submit" disabled={isSaving || !companyId} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300">
                {editingBooking ? <Edit3 size={17} /> : <Plus size={17} />}
                {isSaving ? "Saving..." : editingBooking ? "Save changes" : "Add booking"}
              </button>
            </div>
          </form>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <h3 className="font-semibold text-slate-950">Selected day</h3>
            <p className="mt-1 text-sm text-slate-500">{selectedBookings.length} bookings</p>
            <div className="mt-4 space-y-3">
              {selectedBookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-slate-200 bg-[#f7fbff] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                        <Clock size={15} />
                        {timeLabel(booking.start_time)}{booking.end_time ? ` - ${timeLabel(booking.end_time)}` : ""}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{booking.notes ?? "No booking notes"}</p>
                      <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-600 ring-1 ring-slate-200">{booking.status ?? "pending"}</span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditingBooking(booking)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50" aria-label="Edit booking">
                        <Edit3 size={15} />
                      </button>
                      <button type="button" onClick={() => void deleteBooking(booking.id)} className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100" aria-label="Delete booking">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!selectedBookings.length ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No bookings on this day.
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
