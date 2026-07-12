import { requireAdmin } from "@/src/lib/admin/api";

export const dynamic = "force-dynamic";

function normalizeUrl(value: string) {
  if (!value) {
    return "";
  }

  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function uniqueEmails(html: string) {
  const matches = html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];

  return Array.from(new Set(matches.map((email) => email.toLowerCase()))).filter(
    (email) =>
      !email.endsWith(".png") &&
      !email.endsWith(".jpg") &&
      !email.endsWith(".jpeg") &&
      !email.endsWith(".webp") &&
      !email.includes("example.com"),
  );
}

function contactLinks(html: string, baseUrl: string) {
  const links = Array.from(html.matchAll(/href=["']([^"']+)["']/gi))
    .map((match) => match[1])
    .filter((href) => /contact|about|support|connect|location/i.test(href))
    .slice(0, 6);

  return Array.from(
    new Set(
      links
        .map((href) => {
          try {
            return new URL(href, baseUrl).toString();
          } catch {
            return "";
          }
        })
        .filter(Boolean),
    ),
  );
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "ComvexaAdminLeadFinder/1.0 (https://comvexa.net)" },
    });

    if (!response.ok) {
      return "";
    }

    return await response.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  try {
    const body = (await request.json()) as { leadId?: string };
    const leadId = String(body.leadId ?? "").trim();

    if (!leadId) {
      return Response.json({ error: "Lead id is required." }, { status: 400 });
    }

    const { data: lead, error: leadError } = await admin.supabase
      .from("leads")
      .select("id, website")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      throw leadError ?? new Error("Lead was not found.");
    }

    const website = normalizeUrl(String(lead.website ?? ""));

    if (!website) {
      return Response.json({ error: "This lead has no website to search for an email." }, { status: 400 });
    }

    const homeHtml = await fetchText(website);
    const homeEmails = uniqueEmails(homeHtml);
    let email = homeEmails[0] ?? "";

    if (!email) {
      const links = contactLinks(homeHtml, website);

      for (const link of links) {
        const html = await fetchText(link);
        email = uniqueEmails(html)[0] ?? "";

        if (email) {
          break;
        }
      }
    }

    if (!email) {
      return Response.json({ error: "No public email was found on this lead website." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const { data, error } = await admin.supabase
      .from("leads")
      .update({ email, updated_at: now })
      .eq("id", leadId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ email, lead: data });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not find a public email for this lead." },
      { status: 500 },
    );
  }
}
