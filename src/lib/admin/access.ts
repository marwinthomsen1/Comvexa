export const defaultAdminEmail = "admin@comvexa.net";
export const defaultOwnerDashboardEmail = "owner@comvexa.net";

export function getConfiguredAdminEmail() {
  const configuredEmail =
    typeof window === "undefined"
      ? process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
      : process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  return (configuredEmail || defaultAdminEmail).trim().toLowerCase();
}

export function getConfiguredOwnerDashboardEmail() {
  const configuredEmail =
    typeof window === "undefined"
      ? process.env.OWNER_DASHBOARD_EMAIL || process.env.NEXT_PUBLIC_OWNER_DASHBOARD_EMAIL
      : process.env.NEXT_PUBLIC_OWNER_DASHBOARD_EMAIL;

  return (configuredEmail || defaultOwnerDashboardEmail).trim().toLowerCase();
}

export function isAdminEmail(email?: string | null) {
  return email ? email.trim().toLowerCase() === getConfiguredAdminEmail() : false;
}

export function isOwnerDashboardEmail(email?: string | null) {
  return email ? email.trim().toLowerCase() === getConfiguredOwnerDashboardEmail() : false;
}

export function hasOwnerDashboardAccess(email?: string | null) {
  return isAdminEmail(email) || isOwnerDashboardEmail(email);
}
