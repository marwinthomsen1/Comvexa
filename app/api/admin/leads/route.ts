import { requireAdmin } from "@/src/lib/admin/api";

export const dynamic = "force-dynamic";

const leadStatuses = ["New", "Contacted", "Replied", "Trial Started", "Customer", "Not Interested", "Follow Up Later"];
const leadSources = ["Instagram", "Google", "Facebook", "Website", "Referral", "Manual"];

type LeadBody = {
  id?: string;
  company_name?: string;
  country?: string;
  city?: string;
  industry?: string;
  instagram_url?: string;
  email?: string;
  whatsapp?: string;
  website?: string;
  status?: string;
  source?: string;
  notes?: string;
  follow_up_at?: string | null;
  last_contacted_at?: string | null;
  action?: string;
};

function clean(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function leadPayload(body: LeadBody, partial = false) {
  const payload: Record<string, string | null> = {};
  const textFields = [
    "company_name",
    "country",
    "city",
    "industry",
    "instagram_url",
    "email",
    "whatsapp",
    "website",
    "notes",
  ] as const;

  textFields.forEach((field) => {
    if (!partial || body[field] !== undefined) {
      payload[field] = clean(body[field]);
    }
  });

  if (!partial || body.status !== undefined) {
    if (!leadStatuses.includes(String(body.status ?? ""))) {
      throw new Error("Invalid lead status.");
    }

    payload.status = String(body.status);
  }

  if (!partial || body.source !== undefined) {
    if (!leadSources.includes(String(body.source ?? ""))) {
      throw new Error("Invalid lead source.");
    }

    payload.source = String(body.source);
  }

  if (!partial || body.follow_up_at !== undefined) {
    payload.follow_up_at = clean(body.follow_up_at);
  }

  if (!partial || body.last_contacted_at !== undefined) {
    payload.last_contacted_at = clean(body.last_contacted_at);
  }

  payload.updated_at = new Date().toISOString();
  return payload;
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  try {
    const { data, error } = await admin.supabase
      .from("leads")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500);

    if (error) {
      throw error;
    }

    return Response.json({ leads: data ?? [] });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not load leads." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  try {
    const body = (await request.json()) as LeadBody;

    if (!String(body.company_name ?? "").trim()) {
      return Response.json({ error: "Company name is required." }, { status: 400 });
    }

    const { data, error } = await admin.supabase
      .from("leads")
      .insert(leadPayload({ ...body, status: body.status || "New", source: body.source || "Manual" }))
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ lead: data });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not add lead." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  try {
    const body = (await request.json()) as LeadBody;

    if (!body.id) {
      return Response.json({ error: "Lead id is required." }, { status: 400 });
    }

    const updates =
      body.action === "mark_contacted"
        ? { status: "Contacted", last_contacted_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        : leadPayload(body, true);

    const { data, error } = await admin.supabase
      .from("leads")
      .update(updates)
      .eq("id", body.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ lead: data });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not update lead." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  try {
    const { id } = (await request.json()) as { id?: string };

    if (!id) {
      return Response.json({ error: "Lead id is required." }, { status: 400 });
    }

    const { error } = await admin.supabase.from("leads").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not delete lead." },
      { status: 500 },
    );
  }
}
