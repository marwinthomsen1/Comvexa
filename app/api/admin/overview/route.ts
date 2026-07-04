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

const activityTables = [
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

const allowedPlans = new Set(["basic", "pro", "ultra", "Basic", "Pro", "Ultra"]);
const allowedSubscriptionStatuses = new Set([
  "inactive",
  "trialing",
  "trial_expired",
  "active",
  "past_due",
  "cancelled",
]);
const allowedBillingCycles = new Set(["monthly", "yearly", ""]);

async function requireAdmin(request: Request) {
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
        { error: "Admin dashboard needs SUPABASE_SERVICE_ROLE_KEY in the server environment." },
        { status: 500 },
      ),
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    return { error: Response.json({ error: "Admin login required." }, { status: 401 }) };
  }

  if (!isAdminEmail(userData.user.email)) {
    return { error: Response.json({ error: "This account is not allowed to access admin." }, { status: 403 }) };
  }

  return { supabase, adminEmail: userData.user.email ?? "admin" };
}

async function getCount(supabase: ReturnType<typeof createSupabaseAdminClient>, table: string) {
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

function sumAmount(rows: Array<Record<string, unknown>>, key: string) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function groupCounts(rows: Array<Record<string, unknown>>, key: string) {
  return rows.reduce<Record<string, number>>((groups, row) => {
    const value = String(row[key] ?? "Unknown");
    groups[value] = (groups[value] ?? 0) + 1;
    return groups;
  }, {});
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  try {
    const { supabase, adminEmail } = admin;
    const [
      counts,
      companies,
      customers,
      invoices,
      payments,
      expenses,
      supplierBills,
      tasks,
      bookings,
      employees,
      documents,
      inventory,
      branches,
      users,
      activityCounts,
      emailLogs,
    ] = await Promise.all([
      Promise.all(trackedTables.map(async (table) => [table, await getCount(supabase, table)])),
      supabase
        .from("companies")
        .select("id, name, email, phone, plan, subscription_status, billing_cycle, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("customers")
        .select("id, company_id, name, email, phone, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("invoices")
        .select("id, company_id, invoice_number, total_amount, payment_status, due_date, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("payments")
        .select("id, company_id, amount, payment_method, payment_date, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("expenses")
        .select("id, company_id, title, category, amount, tax_amount, expense_date, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("supplier_bills")
        .select("id, company_id, supplier_name, bill_number, total_amount, payment_status, due_date, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("tasks")
        .select("id, company_id, title, status, priority, due_date, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("bookings")
        .select("id, company_id, booking_date, status, start_time, end_time, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("employees")
        .select("id, company_id, name, email, department, position, status, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("documents")
        .select("id, company_id, title, document_type, expiry_date, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("inventory_items")
        .select("id, company_id, name, quantity, unit, low_stock_alert, supplier, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("branches")
        .select("id, company_id, name, phone, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.auth.admin.listUsers({ page: 1, perPage: 20 }),
      Promise.all(
        activityTables.map(async (table) => {
          const today = new Date();
          today.setDate(today.getDate() - 30);

          const { count, error } = await supabase
            .from(table)
            .select("id", { count: "exact", head: true })
            .gte("created_at", today.toISOString());

          if (error) {
            throw error;
          }

          return [table, count ?? 0];
        }),
      ),
      supabase
        .from("email_logs")
        .select("id, recipient, email_type, subject, status, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const queriedTables = [
      companies,
      customers,
      invoices,
      payments,
      expenses,
      supplierBills,
      tasks,
      bookings,
      employees,
      documents,
      inventory,
      branches,
    ];
    const failedQuery = queriedTables.find((result) => result.error);

    if (failedQuery?.error) {
      throw failedQuery.error;
    }

    const companyRows = (companies.data ?? []) as Array<Record<string, unknown>>;
    const invoiceRows = (invoices.data ?? []) as Array<Record<string, unknown>>;
    const paymentRows = (payments.data ?? []) as Array<Record<string, unknown>>;
    const expenseRows = (expenses.data ?? []) as Array<Record<string, unknown>>;
    const supplierBillRows = (supplierBills.data ?? []) as Array<Record<string, unknown>>;
    const taskRows = (tasks.data ?? []) as Array<Record<string, unknown>>;
    const bookingRows = (bookings.data ?? []) as Array<Record<string, unknown>>;
    const inventoryRows = (inventory.data ?? []) as Array<Record<string, unknown>>;
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const companyActivity = new Map<string, Record<string, unknown> & { activity: number }>();

    queriedTables.slice(1).forEach((result) => {
      ((result.data ?? []) as Array<Record<string, unknown>>).forEach((row) => {
        const company = row.companies;
        const name =
          company && typeof company === "object" && !Array.isArray(company)
            ? String((company as Record<string, unknown>).name ?? "Company")
            : "Company";
        const companyId = String(row.company_id ?? name);
        const current = companyActivity.get(companyId) ?? { name, activity: 0 };
        current.activity += 1;
        companyActivity.set(companyId, current);
      });
    });

    return Response.json({
      adminEmail,
      counts: Object.fromEntries(counts),
      financials: {
        invoiceTotal: sumAmount(invoiceRows, "total_amount"),
        paidInvoiceTotal: sumAmount(
          invoiceRows.filter((row) => String(row.payment_status ?? "").toLowerCase() === "paid"),
          "total_amount",
        ),
        unpaidInvoiceTotal: sumAmount(
          invoiceRows.filter((row) => String(row.payment_status ?? "").toLowerCase() !== "paid"),
          "total_amount",
        ),
        paymentsTotal: sumAmount(paymentRows, "amount"),
        expensesTotal: sumAmount(expenseRows, "amount"),
        supplierBillsTotal: sumAmount(supplierBillRows, "total_amount"),
      },
      breakdowns: {
        plans: groupCounts(companyRows, "plan"),
        subscriptionStatus: groupCounts(companyRows, "subscription_status"),
        invoiceStatus: groupCounts(invoiceRows, "payment_status"),
        taskStatus: groupCounts(taskRows, "status"),
        bookingStatus: groupCounts(bookingRows, "status"),
      },
      alerts: {
        overdueInvoices: invoiceRows.filter((row) => {
          const dueDate = row.due_date ? new Date(String(row.due_date)).getTime() : 0;
          return dueDate > 0 && dueDate < now && String(row.payment_status ?? "").toLowerCase() !== "paid";
        }).length,
        upcomingSupplierBills: supplierBillRows.filter((row) => {
          const dueDate = row.due_date ? new Date(String(row.due_date)).getTime() : 0;
          return dueDate > now && dueDate <= now + sevenDaysMs;
        }).length,
        lowStockItems: inventoryRows.filter((row) => Number(row.quantity ?? 0) <= Number(row.low_stock_alert ?? -1)).length,
        openTasks: taskRows.filter((row) => !["done", "completed"].includes(String(row.status ?? "").toLowerCase())).length,
      },
      activityLast30Days: Object.fromEntries(activityCounts),
      topCompanies: Array.from(companyActivity.values())
        .sort((left, right) => right.activity - left.activity)
        .slice(0, 8),
      recentCompanies: companyRows,
      recentCustomers: customers.data ?? [],
      recentInvoices: invoiceRows.slice(0, 12),
      recentPayments: paymentRows.slice(0, 12),
      recentExpenses: expenseRows.slice(0, 12),
      recentSupplierBills: supplierBillRows.slice(0, 12),
      recentTasks: taskRows.slice(0, 12),
      recentBookings: bookingRows.slice(0, 12),
      recentEmployees: employees.data ?? [],
      recentDocuments: documents.data ?? [],
      recentInventory: inventoryRows,
      recentBranches: branches.data ?? [],
      recentEmailLogs: emailLogs.error ? [] : emailLogs.data ?? [],
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

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  try {
    const body = (await request.json()) as {
      companyId?: string;
      plan?: string;
      subscriptionStatus?: string;
      billingCycle?: string;
    };
    const updates: Record<string, string | null> = {};

    if (!body.companyId) {
      return Response.json({ error: "Company id is required." }, { status: 400 });
    }

    if (body.plan !== undefined) {
      if (!allowedPlans.has(body.plan)) {
        return Response.json({ error: "Invalid plan." }, { status: 400 });
      }

      updates.plan = body.plan;
    }

    if (body.subscriptionStatus !== undefined) {
      if (!allowedSubscriptionStatuses.has(body.subscriptionStatus)) {
        return Response.json({ error: "Invalid subscription status." }, { status: 400 });
      }

      updates.subscription_status = body.subscriptionStatus;
    }

    if (body.billingCycle !== undefined) {
      if (!allowedBillingCycles.has(body.billingCycle)) {
        return Response.json({ error: "Invalid billing cycle." }, { status: 400 });
      }

      updates.billing_cycle = body.billingCycle || null;
    }

    if (!Object.keys(updates).length) {
      return Response.json({ error: "No changes were provided." }, { status: 400 });
    }

    const { data, error } = await admin.supabase
      .from("companies")
      .update(updates)
      .eq("id", body.companyId)
      .select("id, name, email, phone, plan, subscription_status, billing_cycle, created_at")
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ success: true, company: data });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not update company." },
      { status: 500 },
    );
  }
}
