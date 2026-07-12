import { isAdminEmail } from "@/src/lib/admin/access";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export async function requireAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return { error: Response.json({ error: "Admin login required." }, { status: 401 }) };
  }

  let supabase;

  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return {
      error: Response.json(
        { error: "Admin features need SUPABASE_SERVICE_ROLE_KEY in the server environment." },
        { status: 500 },
      ),
    };
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { error: Response.json({ error: "Admin login required." }, { status: 401 }) };
  }

  if (!isAdminEmail(data.user.email)) {
    return { error: Response.json({ error: "This account is not allowed to access admin." }, { status: 403 }) };
  }

  return { supabase, adminEmail: data.user.email ?? "admin" };
}
