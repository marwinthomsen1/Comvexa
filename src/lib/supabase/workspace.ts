import { supabase } from "./client";

const companyIds = new Map<string, string>();
const pendingCompanyIds = new Map<string, Promise<string | null>>();

export function getWorkspaceCompanyId(userId: string) {
  const cached = companyIds.get(userId);

  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = pendingCompanyIds.get(userId);

  if (pending) {
    return pending;
  }

  const request = (async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userId)
        .single();

      if (error || !data?.company_id) {
        return null;
      }

      companyIds.set(userId, data.company_id);
      return data.company_id;
    } catch {
      return null;
    } finally {
      pendingCompanyIds.delete(userId);
    }
  })();

  pendingCompanyIds.set(userId, request);
  return request;
}
