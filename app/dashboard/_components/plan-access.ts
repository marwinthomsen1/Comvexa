export type PlanName = "Basic" | "Pro" | "Ultra";

export const defaultPlan: PlanName = "Pro";

export const planModules: Record<PlanName, string[]> = {
  Basic: [
    "Dashboard",
    "Customers",
    "Services",
    "Tasks",
    "Invoices",
    "Payments",
    "Expenses",
    "Reports",
    "Subscription",
    "Settings",
  ],
  Pro: [
    "Dashboard",
    "Customers",
    "Employees",
    "Services",
    "Bookings",
    "Tasks",
    "Invoices",
    "Payments",
    "Expenses",
    "Documents",
    "Recurring Invoices",
    "Staff Schedules",
    "WhatsApp Templates",
    "Reports",
    "Subscription",
    "Settings",
  ],
  Ultra: [
    "Dashboard",
    "Customers",
    "Employees",
    "Services",
    "Bookings",
    "Tasks",
    "Invoices",
    "Payments",
    "Expenses",
    "Documents",
    "Inventory",
    "Supplier Bills",
    "Branches",
    "Permissions",
    "Reports",
    "Subscription",
    "Settings",
  ],
};

export function normalizePlan(plan: string | null): PlanName {
  if (plan === "Basic" || plan === "Pro" || plan === "Ultra") {
    return plan;
  }

  return defaultPlan;
}

export function canUseModule(plan: PlanName, moduleName: string) {
  return planModules[plan].includes(moduleName);
}
