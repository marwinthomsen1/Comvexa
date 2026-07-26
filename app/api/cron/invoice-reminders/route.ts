import { sendInvoiceReminderEmail } from "@/src/lib/email";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }
  const admin = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const cutoff = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data: invoices, error } = await admin.from("invoices")
    .select("id, company_id, invoice_number, customer_name, customer_email, total_amount, due_date, reminder_count, last_reminder_at, companies(name)")
    .neq("payment_status", "paid").eq("reminders_enabled", true).lt("due_date", today)
    .or(`last_reminder_at.is.null,last_reminder_at.lt.${cutoff}`).limit(100);
  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
  let sent = 0;
  const failures: string[] = [];
  for (const invoice of invoices ?? []) {
    if (!invoice.customer_email) continue;
    try {
      const companyRelation = invoice.companies as unknown as { name?: string } | null;
      await sendInvoiceReminderEmail({ to: invoice.customer_email, customerName: invoice.customer_name ?? undefined, companyName: companyRelation?.name ?? "Comvexa company", invoiceNumber: invoice.invoice_number ?? "Invoice", amount: invoice.total_amount ?? 0, dueDate: invoice.due_date ?? undefined });
      await admin.from("invoices").update({ last_reminder_at: new Date().toISOString(), reminder_count: Number(invoice.reminder_count ?? 0) + 1 }).eq("id", invoice.id);
      sent += 1;
    } catch (sendError) {
      failures.push(`${invoice.id}: ${sendError instanceof Error ? sendError.message : "failed"}`);
    }
  }
  return Response.json({ success: true, sent, failures });
}
