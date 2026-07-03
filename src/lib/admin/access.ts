export const defaultAdminEmail = "admin@comvexa.net";

export function getConfiguredAdminEmail() {
  const configuredEmail =
    typeof window === "undefined"
      ? process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
      : process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  return (configuredEmail || defaultAdminEmail).trim().toLowerCase();
}

export function isAdminEmail(email?: string | null) {
  return email ? email.trim().toLowerCase() === getConfiguredAdminEmail() : false;
}
