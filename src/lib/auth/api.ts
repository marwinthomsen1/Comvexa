import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export async function requireUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return { error: Response.json({ error: "Login required." }, { status: 401 }) };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { error: Response.json({ error: "Login required." }, { status: 401 }) };
  }

  return { supabase, user: data.user };
}
