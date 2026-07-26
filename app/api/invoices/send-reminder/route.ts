import { createClient } from "@supabase/supabase-js";
import { sendInvoiceReminderEmail } from "@/src/lib/email";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export const dynamic = "force-dynamic";

function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing Supabase auth environment variables.");
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return Response.json({ success: false, error: "Sign in before sending a reminder." }, { status: 401 });

    const auth = createAuthClient();
    const { data: authData, error: authError } = await auth.auth.getUser(token);
    if (authError || !authData.user) {
      return Response.json({ success: false, error: "Your session is no longer valid." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { invoiceId?: string; currency?: string };
    const invoiceId = String(body.invoiceId ?? "").trim();
    const currency = String(body.currency ?? "USD").trim().toUpperCase().slice(0, 3);
    if (!isUuid(invoiceId)) {
      return Response.json({ success: false, error: "A valid invoice is required." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin.from("profiles").select("company_id").eq("id", authData.user.id).single();
    if (!profile?.company_id) {
      return Response.json({ success: false, error: "Your account is not connected to a company." }, { status: 403 });
    }

    const [invoiceResult, companyResult] = await Promise.all([
      admin.from("invoices").select("id, invoice_number, customer_name, customer_email, total_amount, due_date, payment_status, reminder_count").eq("id", invoiceId).eq("company_id", profile.company_id).single(),
      admin.from("companies").select("name").eq("id", profile.company_id).single(),
    ]);
    const invoice = invoiceResult.data;
    if (invoiceResult.error || !invoice) {
      return Response.json({ success: false, error: "Invoice not found in your workspace." }, { status: 404 });
    }
    if (String(invoice.payment_status ?? "").toLowerCase() === "paid") {
      return Response.json({ success: false, error: "This invoice is already marked as paid." }, { status: 409 });
    }
    const recipient = String(invoice.customer_email ?? "").trim();
    if (!isEmail(recipient)) {
      return Response.json({ success: false, error: "Add a valid customer email to this invoice first." }, { status: 400 });
    }

    const data = await sendInvoiceReminderEmail({
      to: recipient,
      customerName: String(invoice.customer_name ?? "").trim() || undefined,
      companyName: String(companyResult.data?.name ?? "").trim() || "Comvexa company",
      invoiceNumber: String(invoice.invoice_number ?? "Invoice"),
      amount: Number(invoice.total_amount ?? 0),
      currency,
      dueDate: invoice.due_date ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${invoice.due_date}T00:00:00`)) : undefined,
    });
    await admin.from("invoices").update({ last_reminder_at: new Date().toISOString(), reminder_count: Number(invoice.reminder_count ?? 0) + 1 }).eq("id", invoice.id);

    return Response.json({ success: true, id: data?.id ?? null, recipient });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Could not send the reminder." },
      { status: 500 },
    );
  }
}
