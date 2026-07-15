export type PlanName = "Basic" | "Pro" | "Ultra";

export const defaultPlan: PlanName = "Pro";

const basicModules = [
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
];

const proModules = [
  ...basicModules,
  "Employees",
  "Bookings",
  "Documents",
  "Recurring Invoices",
  "Staff Schedules",
  "WhatsApp Templates",
];

export const planModules: Record<PlanName, string[]> = {
  Basic: basicModules,
  Pro: proModules,
  Ultra: [
    ...proModules,
    "Inventory",
    "Supplier Bills",
    "Branches",
    "Permissions",
    "AI Assistant",
    "Automations",
    "Customer Portal",
    "Audit Logs",
    "Approvals",
    "Purchase Orders",
    "Time & Attendance",
    "Branch Analytics",
    "White Label",
    "Data Import",
  ],
};

export function normalizePlan(plan: string | null): PlanName {
  const normalized = plan?.trim().toLowerCase();

  if (normalized === "basic") return "Basic";
  if (normalized === "pro") return "Pro";
  if (normalized === "ultra") return "Ultra";

  return defaultPlan;
}

export function canUseModule(plan: PlanName, moduleName: string) {
  return planModules[plan].includes(moduleName);
}
