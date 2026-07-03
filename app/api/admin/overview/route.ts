import { isAdminEmail } from "@/src/lib/admin/access";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export const dynamic = "force-dynamic";

const trackedTables = [
  "companies",
  "profiles",
  "customers",
  "employees",
  "services",
  "bookings",
  "tasks",
  "invoices",
  "payments",
  "expenses",
  "supplier_bills",
  "documents",
  "inventory_items",
  "branches",
] as const;

async function getCount(supabase: ReturnType<typeof createSupabaseAdminClient>, table: string) {
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  let supabase;

  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return Response.json(
      { error: "Admin dashboard needs SUPABASE_SERVICE_ROLE_KEY in the server environment." },
      { status: 500 },
    );
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  if (!isAdminEmail(userData.user.email)) {
    return Response.json({ error: "This account is not allowed to access admin." }, { status: 403 });
  }

  try {
    const [counts, companies, customers, invoices, payments, users] = await Promise.all([
      Promise.all(trackedTables.map(async (table) => [table, await getCount(supabase, table)])),
      supabase
        .from("companies")
        .select("id, name, email, plan, subscription_status, billing_cycle, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("customers")
        .select("id, company_id, name, email, phone, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("invoices")
        .select("id, company_id, invoice_number, total_amount, payment_status, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("payments")
        .select("id, company_id, amount, payment_method, payment_date, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.auth.admin.listUsers({ page: 1, perPage: 10 }),
    ]);

    const failedQuery = [companies, customers, invoices, payments].find((result) => result.error);

    if (failedQuery?.error) {
      throw failedQuery.error;
    }

    return Response.json({
      adminEmail: userData.user.email,
      counts: Object.fromEntries(counts),
      recentCompanies: companies.data ?? [],
      recentCustomers: customers.data ?? [],
      recentInvoices: invoices.data ?? [],
      recentPayments: payments.data ?? [],
      recentUsers: users.data.users.map((user) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      })),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not load admin overview." },
      { status: 500 },
    );
  }
}
