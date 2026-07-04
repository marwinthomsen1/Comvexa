import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/src/lib/admin/access";
import { sendAdminCustomerEmail } from "@/src/lib/email";

export const dynamic = "force-dynamic";

function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase auth environment variables.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function requireAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return { error: Response.json({ success: false, error: "Admin login required." }, { status: 401 }) };
  }

  const supabase = createAuthClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { error: Response.json({ success: false, error: "Admin login required." }, { status: 401 }) };
  }

  if (!isAdminEmail(data.user.email)) {
    return {
      error: Response.json({ success: false, error: "This account is not allowed to send admin email." }, { status: 403 }),
    };
  }

  return { adminEmail: data.user.email ?? "admin" };
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getAppUrl() {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://comvexa.net").replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);

    if (admin.error) {
      return admin.error;
    }

    const body = (await request.json()) as {
      to?: string;
      customerName?: string;
      companyName?: string;
      subject?: string;
      message?: string;
      ctaLabel?: string;
      ctaUrl?: string;
      emailType?: string;
    };
    const to = String(body.to ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();
    const ctaLabel = String(body.ctaLabel ?? "").trim();
    const ctaUrl = String(body.ctaUrl ?? "").trim();
    const emailType = String(body.emailType ?? "custom").trim();

    if (!isEmail(to)) {
      return Response.json({ success: false, error: "Enter a valid customer email address." }, { status: 400 });
    }

    if (emailType === "password_reset") {
      const supabase = createAuthClient();
      const { error } = await supabase.auth.resetPasswordForEmail(to, {
        redirectTo: `${getAppUrl()}/reset-password`,
      });

      if (error) {
        throw error;
      }

      return Response.json({
        success: true,
        type: "password_reset",
        sentBy: admin.adminEmail,
      });
    }

    if (subject.length < 3) {
      return Response.json({ success: false, error: "Email subject is too short." }, { status: 400 });
    }

    if (message.length < 10) {
      return Response.json({ success: false, error: "Email message is too short." }, { status: 400 });
    }

    if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
      return Response.json(
        { success: false, error: "Button label and button URL must be used together." },
        { status: 400 },
      );
    }

    if (ctaUrl && !/^https?:\/\//i.test(ctaUrl)) {
      return Response.json({ success: false, error: "Button URL must start with http:// or https://." }, { status: 400 });
    }

    const data = await sendAdminCustomerEmail({
      to,
      customerName: body.customerName,
      companyName: body.companyName,
      subject,
      message,
      ctaLabel: ctaLabel || undefined,
      ctaUrl: ctaUrl || undefined,
    });

    return Response.json({
      success: true,
      id: data?.id ?? null,
      sentBy: admin.adminEmail,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not send customer email.",
      },
      { status: 500 },
    );
  }
}
