import { sendBookingConfirmationEmail } from "@/src/lib/email";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createSupabaseAdminClient();
  const { data: settings } = await admin.from("booking_settings").select("company_id, public_slug, deposit_type, deposit_amount, cancellation_hours, confirmation_enabled").eq("public_slug", slug).eq("public_booking_enabled", true).single();
  if (!settings) return Response.json({ error: "This booking page is not available." }, { status: 404 });
  const [company, services] = await Promise.all([
    admin.from("companies").select("name, logo_url").eq("id", settings.company_id).single(),
    admin.from("services").select("id, name, description, price, duration_minutes").eq("company_id", settings.company_id).eq("status", "active").order("name"),
  ]);
  return Response.json({ company: company.data, services: services.data ?? [], settings: { depositType: settings.deposit_type, depositAmount: settings.deposit_amount, cancellationHours: settings.cancellation_hours } });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createSupabaseAdminClient();
  const { data: settings } = await admin.from("booking_settings").select("company_id, deposit_type, deposit_amount, confirmation_enabled").eq("public_slug", slug).eq("public_booking_enabled", true).single();
  if (!settings) return Response.json({ error: "This booking page is not available." }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const customerName = String(body.customerName ?? "").trim();
  const customerEmail = String(body.customerEmail ?? "").trim();
  const bookingDate = String(body.bookingDate ?? "");
  const startTime = String(body.startTime ?? "");
  const serviceId = String(body.serviceId ?? "");
  if (!customerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || !/^\d{2}:\d{2}$/.test(startTime)) {
    return Response.json({ error: "Complete the required booking details." }, { status: 400 });
  }
  const { data: service } = serviceId ? await admin.from("services").select("name, duration_minutes").eq("id", serviceId).eq("company_id", settings.company_id).single() : { data: null };
  const end = new Date(`${bookingDate}T${startTime}:00`);
  end.setMinutes(end.getMinutes() + Number(service?.duration_minutes ?? 60));
  const depositAmount = settings.deposit_type === "fixed" ? Number(settings.deposit_amount ?? 0) : 0;
  const { data: booking, error } = await admin.from("bookings").insert({
    company_id: settings.company_id, service_id: serviceId || null, customer_name: customerName,
    customer_email: customerEmail, customer_phone: String(body.customerPhone ?? "").trim() || null,
    booking_date: bookingDate, start_time: startTime, end_time: end.toTimeString().slice(0, 5),
    status: depositAmount > 0 ? "pending" : "confirmed", deposit_amount: depositAmount,
    deposit_status: depositAmount > 0 ? "pending" : "not_required", notes: String(body.notes ?? "").trim() || null,
  }).select("id").single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (settings.confirmation_enabled) {
    const { data: company } = await admin.from("companies").select("name").eq("id", settings.company_id).single();
    try {
      await sendBookingConfirmationEmail({ to: customerEmail, customerName, companyName: company?.name ?? "Comvexa company", bookingDateTime: `${bookingDate} at ${startTime}` });
      await admin.from("bookings").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", booking.id);
    } catch {
      // The booking remains valid if email delivery is temporarily unavailable.
    }
  }
  return Response.json({ success: true, bookingId: booking.id });
}
