import { requireAdmin } from "@/src/lib/admin/api";
import { sendAdminOutreachEmail } from "@/src/lib/email";

export const dynamic = "force-dynamic";

const unsubscribeLine =
  "If you do not want to receive messages from us, reply with 'unsubscribe' and we will not contact you again.";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function startOfTodayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  try {
    const body = (await request.json()) as {
      leadId?: string;
      subject?: string;
      message?: string;
      template?: string;
      to?: string;
    };
    const leadId = String(body.leadId ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const baseMessage = String(body.message ?? "").trim();

    if (!leadId) {
      return Response.json({ error: "Lead id is required." }, { status: 400 });
    }

    if (subject.length < 3 || baseMessage.length < 20) {
      return Response.json({ error: "Email subject and message are required." }, { status: 400 });
    }

    const { data: lead, error: leadError } = await admin.supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      throw leadError ?? new Error("Lead was not found.");
    }

    const email = String(body.to ?? lead.email ?? "").trim();
    const notes = String(lead.notes ?? "").toLowerCase();

    if (!isEmail(email)) {
      return Response.json({ error: "This lead does not have a valid email address." }, { status: 400 });
    }

    if (String(lead.status ?? "") === "Not Interested") {
      return Response.json({ error: "Cannot send email to a lead marked Not Interested." }, { status: 400 });
    }

    if (notes.includes("unsubscribe")) {
      return Response.json({ error: "Cannot send email because this lead has unsubscribe in notes." }, { status: 400 });
    }

    const { count, error: countError } = await admin.supabase
      .from("email_logs")
      .select("id", { count: "exact", head: true })
      .eq("email_type", "admin_outreach_message")
      .eq("status", "sent")
      .gte("created_at", startOfTodayIso());

    if (countError) {
      throw countError;
    }

    if ((count ?? 0) >= 50) {
      return Response.json({ error: "Daily admin outreach email limit reached. Maximum is 50 per day." }, { status: 429 });
    }

    const message = `${baseMessage}\n\n${unsubscribeLine}`;
    const data = await sendAdminOutreachEmail({
      to: email,
      customerName: String(lead.company_name ?? "there"),
      companyName: String(lead.company_name ?? ""),
      subject,
      message,
      ctaLabel: "Start free trial",
      ctaUrl: "https://comvexa.net",
      leadId,
      source: String(lead.source ?? ""),
    });

    const now = new Date().toISOString();
    await admin.supabase
      .from("leads")
      .update({ email, status: "Contacted", last_contacted_at: now, updated_at: now })
      .eq("id", leadId);

    return Response.json({ success: true, id: data?.id ?? null });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not send outreach email." },
      { status: 500 },
    );
  }
}
