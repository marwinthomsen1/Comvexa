import { cleanText } from "../workspace/validation.js";
// Configuration and explicit enablement are checked server-side in config.js.
export const AUTH_UNAVAILABLE =
  "Cloud accounts are not connected yet. Explore the local workspace while development setup is completed.";
export function validateAuth(mode, input) {
  if (!["login", "register"].includes(mode))
    throw new Error("Choose a valid account action.");
  const email = cleanText(input.email, "Email", 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid email address.");
  if (
    typeof input.password !== "string" ||
    input.password.length < 12 ||
    input.password.length > 128
  )
    throw new Error("Use a password with 12–128 characters.");
  if (mode === "register") cleanText(input.displayName, "Name", 60);
  return { email };
}
export function unavailableResponse() {
  return Response.json(
    { error: "development_service_not_configured", message: AUTH_UNAVAILABLE },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
