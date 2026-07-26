"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarCheck2, CalendarDays, ChevronLeft, ChevronRight, Clock, Download, Edit3, Hourglass, Palette, Plus, Sparkles, Trash2, X } from "lucide-react";
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
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  deposit_amount: number | null;
  deposit_status: string | null;
  cancellation_reason: string | null;
  no_show: boolean | null;
  created_at: string | null;
};

type CalendarDesign = "classic" | "compact" | "colorful";

const calendarDesigns: { value: CalendarDesign; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "compact", label: "Compact" },
  { value: "colorful", label: "Colorful" },
];

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function timeLabel(time: string | null) {
  return time ? time.slice(0, 5) : "Any time";
}

function icsEscape(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
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
  const [userId, setUserId] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendarDesign, setCalendarDesign] = useState<CalendarDesign>("classic");
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

    setUserId(user.id);
    const savedDesign = window.localStorage.getItem(`comvexa-booking-calendar-design:${user.id}`);
    if (calendarDesigns.some((design) => design.value === savedDesign)) {
      setCalendarDesign(savedDesign as CalendarDesign);
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
  const confirmedCount = monthBookings.filter((booking) => booking.status === "confirmed").length;
  const pendingCount = monthBookings.filter((booking) => !booking.status || booking.status === "pending").length;

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
      customer_name: String(formData.get("customer_name") ?? "").trim() || null,
      customer_email: String(formData.get("customer_email") ?? "").trim() || null,
      customer_phone: String(formData.get("customer_phone") ?? "").trim() || null,
      deposit_amount: Number(formData.get("deposit_amount") ?? 0),
      deposit_status: String(formData.get("deposit_status") ?? "not_required"),
      cancellation_reason: String(formData.get("cancellation_reason") ?? "").trim() || null,
      no_show: formData.get("no_show") === "on",
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

  function chooseCalendarDesign(design: CalendarDesign) {
    setCalendarDesign(design);
    if (userId) {
      window.localStorage.setItem(`comvexa-booking-calendar-design:${userId}`, design);
    }
  }

  function exportCalendar() {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Comvexa//Pro Bookings//EN"];
    bookings.forEach((booking) => {
      if (!booking.booking_date) return;
      const start = `${booking.booking_date.replaceAll("-", "")}T${String(booking.start_time ?? "09:00").replaceAll(":", "").slice(0, 4)}00`;
      const end = `${booking.booking_date.replaceAll("-", "")}T${String(booking.end_time ?? booking.start_time ?? "10:00").replaceAll(":", "").slice(0, 4)}00`;
      lines.push("BEGIN:VEVENT", `UID:${booking.id}@comvexa.net`, `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${icsEscape(booking.customer_name || booking.notes || "Booking")}`, `DESCRIPTION:${icsEscape(booking.notes || "")}`, "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "comvexa-bookings.ics";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto w-full max-w-[1560px] flex-1 p-4 sm:p-6">
      <section className="dashboard-custom-hero relative overflow-hidden rounded-[2rem] bg-[#073f47] p-6 text-white shadow-xl shadow-[#073f47]/10 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-[#ffd56a]/20 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 size-40 rounded-full bg-[#65d9c4]/15 blur-2xl" />
        <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[#8ce5d4]">
              <Sparkles size={15} />
              <p className="text-xs font-bold uppercase tracking-[0.18em]">Scheduling studio</p>
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your bookings, beautifully organized.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#bad5d7]">
              Plan appointments, customize the calendar, and keep every customer visit moving from one focused workspace.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="This month" value={String(monthBookings.length)} tone="mint" />
            <Metric label="Confirmed" value={String(confirmedCount)} tone="blue" />
            <Metric label="Pending" value={String(pendingCount)} tone="amber" />
            <Metric label="Upcoming" value={String(upcomingCount)} tone="coral" />
          </div>
        </div>
      </section>

      <section className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 overflow-hidden rounded-[2rem] border border-[#dbe7e5] bg-[#fbfdfc] shadow-sm">
          <div className="border-b border-[#e3ecea] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#dcf8f0] text-[#08766d] ring-1 ring-[#c4eee3]">
                <CalendarDays size={21} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#138178]">Calendar overview</p>
                <h3 className="mt-0.5 text-xl font-semibold tracking-normal text-slate-950">{monthLabel(month)}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{isLoading ? "Loading schedule..." : `${bookings.length} bookings in your workspace`}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={exportCalendar} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50" title="Import this file into Google Calendar or Outlook"><Download size={14} />Calendar .ics</button>
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="Calendar design">
                <span className="flex size-8 items-center justify-center text-slate-500" title="Calendar design">
                  <Palette size={16} aria-hidden="true" />
                </span>
                {calendarDesigns.map((design) => (
                  <button
                    key={design.value}
                    type="button"
                    onClick={() => chooseCalendarDesign(design.value)}
                    aria-pressed={calendarDesign === design.value}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      calendarDesign === design.value
                        ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200"
                        : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
                    }`}
                  >
                    {design.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => moveMonth(-1)} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Previous month">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => { setMonth(new Date()); setSelectedDate(todayKey); }} className="rounded-xl bg-[#073f47] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#09515b]">
                Today
              </button>
              <button type="button" onClick={() => moveMonth(1)} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Next month">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          </div>

          <div className={`dashboard-calendar-scroll overflow-x-auto p-4 [scrollbar-width:thin] sm:p-6 ${calendarDesign === "colorful" ? "bg-gradient-to-br from-amber-50 via-white to-cyan-50" : ""}`}>
          <div className={`grid min-w-[42rem] grid-cols-7 text-center text-xs font-semibold uppercase tracking-widest sm:min-w-0 ${calendarDesign === "compact" ? "gap-1 text-slate-500" : "gap-2 text-slate-400"}`}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className={`grid min-w-[42rem] grid-cols-7 sm:min-w-0 ${calendarDesign === "compact" ? "mt-1 gap-1" : "mt-2 gap-2"}`}>
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
                  className={`${calendarDesign === "compact" ? "min-h-20 rounded-lg p-1.5" : calendarDesign === "colorful" ? "min-h-28 rounded-3xl p-2.5 shadow-sm" : "min-h-28 rounded-2xl p-2"} border text-left transition ${
                    selected
                      ? calendarDesign === "colorful"
                        ? "border-violet-400 bg-gradient-to-br from-violet-100 to-fuchsia-50 ring-4 ring-violet-100"
                        : "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100"
                      : inMonth
                        ? calendarDesign === "colorful"
                          ? "border-white/80 bg-white/90 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                        : "border-slate-100 bg-slate-50/60 text-slate-400"
                  }`}
                >
                  <span className={`inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold ${isToday ? "bg-emerald-600 text-white" : "text-slate-700"}`}>
                    {date.getDate()}
                  </span>
                  <div className={`${calendarDesign === "compact" ? "mt-1" : "mt-2"} space-y-1`}>
                    {dayBookings.slice(0, 3).map((booking) => (
                      <span key={booking.id} className={`block truncate px-2 text-[11px] font-semibold ${
                        calendarDesign === "compact"
                          ? "rounded-md bg-emerald-50 py-0.5 text-emerald-700"
                          : calendarDesign === "colorful"
                            ? "rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 py-1 text-blue-800"
                            : "rounded-lg bg-blue-50 py-1 text-blue-700"
                      }`}>
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

        <aside className="min-w-0 space-y-5 xl:sticky xl:top-24 xl:self-start">
          <form key={editingBooking?.id ?? selectedDate} onSubmit={handleSave} className="overflow-hidden rounded-[2rem] border border-[#dbe7e5] bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3 bg-[#fff5df] p-5 ring-1 ring-inset ring-[#f5dfad]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a86713]">{editingBooking ? "Update appointment" : "New appointment"}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">{editingBooking ? "Edit booking" : "Add booking"}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600"><CalendarCheck2 size={14} />{new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
              </div>
              {editingBooking ? (
                <button type="button" onClick={() => setEditingBooking(null)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Cancel edit">
                  <X size={17} />
                </button>
              ) : null}
            </div>
            <div className="grid gap-4 p-5">
              <div className="grid grid-cols-2 gap-3"><label><span className="text-sm font-medium text-slate-700">Customer</span><input name="customer_name" defaultValue={editingBooking?.customer_name ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[#d9e4e2] bg-[#f9fbfb] px-3 text-sm" /></label><label><span className="text-sm font-medium text-slate-700">Email</span><input name="customer_email" type="email" defaultValue={editingBooking?.customer_email ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[#d9e4e2] bg-[#f9fbfb] px-3 text-sm" /></label></div>
              <label><span className="text-sm font-medium text-slate-700">Customer phone</span><input name="customer_phone" type="tel" defaultValue={editingBooking?.customer_phone ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[#d9e4e2] bg-[#f9fbfb] px-3 text-sm" /></label>
              <label>
                <span className="text-sm font-medium text-slate-700">Date</span>
                <input name="booking_date" type="date" required defaultValue={editingBooking?.booking_date ?? selectedDate} className="mt-2 h-11 w-full rounded-xl border border-[#d9e4e2] bg-[#f9fbfb] px-3 text-sm outline-none focus:border-[#0c8178] focus:bg-white focus:ring-4 focus:ring-[#d9f4ed]" />
              </label>
              <div className="grid grid-cols-2 gap-3"><label><span className="text-sm font-medium text-slate-700">Deposit</span><input name="deposit_amount" type="number" step="any" min="0" defaultValue={editingBooking?.deposit_amount ?? 0} className="mt-2 h-11 w-full rounded-xl border border-[#d9e4e2] bg-[#f9fbfb] px-3 text-sm" /></label><label><span className="text-sm font-medium text-slate-700">Deposit status</span><select name="deposit_status" defaultValue={editingBooking?.deposit_status ?? "not_required"} className="mt-2 h-11 w-full rounded-xl border border-[#d9e4e2] bg-[#f9fbfb] px-3 text-sm"><option value="not_required">Not required</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="refunded">Refunded</option></select></label></div>
              <label><span className="text-sm font-medium text-slate-700">Cancellation reason</span><input name="cancellation_reason" defaultValue={editingBooking?.cancellation_reason ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[#d9e4e2] bg-[#f9fbfb] px-3 text-sm" /></label>
              <label className="flex items-center gap-3 rounded-xl border border-[#d9e4e2] bg-[#f9fbfb] p-3 text-sm font-medium text-slate-700"><input name="no_show" type="checkbox" defaultChecked={Boolean(editingBooking?.no_show)} className="size-4" />Mark as no-show</label>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="text-sm font-medium text-slate-700">Start</span>
                  <input name="start_time" type="time" defaultValue={editingBooking?.start_time ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[#d9e4e2] bg-[#f9fbfb] px-3 text-sm outline-none focus:border-[#0c8178] focus:bg-white focus:ring-4 focus:ring-[#d9f4ed]" />
                </label>
                <label>
                  <span className="text-sm font-medium text-slate-700">End</span>
                  <input name="end_time" type="time" defaultValue={editingBooking?.end_time ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[#d9e4e2] bg-[#f9fbfb] px-3 text-sm outline-none focus:border-[#0c8178] focus:bg-white focus:ring-4 focus:ring-[#d9f4ed]" />
                </label>
              </div>
              <label>
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select name="status" defaultValue={editingBooking?.status ?? "pending"} className="mt-2 h-11 w-full rounded-xl border border-[#d9e4e2] bg-[#f9fbfb] px-3 text-sm capitalize outline-none focus:border-[#0c8178] focus:bg-white focus:ring-4 focus:ring-[#d9f4ed]">
                  {["pending", "confirmed", "completed", "cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Booking notes</span>
                <textarea name="notes" rows={3} defaultValue={editingBooking?.notes ?? ""} placeholder="Customer, service, location, or booking details" className="mt-2 w-full rounded-xl border border-[#d9e4e2] bg-[#f9fbfb] px-3 py-2.5 text-sm outline-none focus:border-[#0c8178] focus:bg-white focus:ring-4 focus:ring-[#d9f4ed]" />
              </label>
              {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100" role="alert">{error}</p> : null}
              <button type="submit" disabled={isSaving || !companyId} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#ff7356] px-4 text-sm font-semibold text-white shadow-lg shadow-orange-100 transition hover:-translate-y-0.5 hover:bg-[#f65f42] disabled:translate-y-0 disabled:bg-slate-300 disabled:shadow-none">
                {editingBooking ? <Edit3 size={17} /> : <Plus size={17} />}
                {isSaving ? "Saving..." : editingBooking ? "Save changes" : "Add booking"}
              </button>
            </div>
          </form>

          <section className="rounded-[2rem] bg-[#152e38] p-5 text-white shadow-lg shadow-slate-900/10">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#84d9ca]">Day agenda</p><h3 className="mt-1 font-semibold text-white">Selected day</h3></div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">{selectedBookings.length} bookings</span>
            </div>
            <div className="mt-4 space-y-3">
              {selectedBookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl bg-white/7 p-4 ring-1 ring-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Clock size={15} />
                        {timeLabel(booking.start_time)}{booking.end_time ? ` - ${timeLabel(booking.end_time)}` : ""}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#b8c9cf]">{booking.notes ?? "No booking notes"}</p>
                      <span className="mt-3 inline-flex rounded-full bg-[#8ce5d4]/15 px-3 py-1 text-xs font-semibold capitalize text-[#8ce5d4] ring-1 ring-[#8ce5d4]/20">{booking.status ?? "pending"}</span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditingBooking(booking)} className="rounded-xl bg-white/10 p-2 text-white ring-1 ring-white/10 hover:bg-white/15" aria-label="Edit booking">
                        <Edit3 size={15} />
                      </button>
                      <button type="button" onClick={() => void deleteBooking(booking.id)} className="rounded-xl bg-red-400/10 p-2 text-red-300 ring-1 ring-red-300/20 hover:bg-red-400/20" aria-label="Delete booking">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!selectedBookings.length ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center">
                  <Hourglass className="mx-auto text-[#7da0a9]" size={20} />
                  <p className="mt-2 text-sm text-[#9bb1b8]">No bookings on this day.</p>
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "mint" | "blue" | "amber" | "coral" }) {
  const toneClass = {
    mint: "bg-[#8ce5d4] text-[#073f47]",
    blue: "bg-[#d7e9ff] text-[#17456f]",
    amber: "bg-[#ffe29a] text-[#674710]",
    coral: "bg-[#ffb5a2] text-[#6c2c1d]",
  }[tone];

  return (
    <div className={`min-w-24 rounded-2xl px-4 py-3 ${toneClass}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
