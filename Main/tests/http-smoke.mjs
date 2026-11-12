import assert from "node:assert/strict";
const origin = process.env.COMVEXA_TEST_ORIGIN || "http://127.0.0.1:3000";
const url = new URL(origin);
assert.ok(["127.0.0.1", "localhost"].includes(url.hostname), "HTTP tests must target loopback, never production.");
for (const path of ["/", "/login", "/register", "/dashboard", "/dashboard/projects", "/dashboard/campaigns", "/dashboard/settings", "/dashboard/templates"]) {
  const response = await fetch(new URL(path, origin));
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.ok(html.includes("noindex"), `${path}: preview must stay noindex`);
  console.log(`PASS ${path}: 200`);
}
for (const [path, method] of [["/api/auth", "POST"], ["/api/projects", "GET"], ["/api/projects", "POST"]]) {
  const response = await fetch(new URL(path, origin), { method, headers: { Cookie: "preview_user=spoofed", Authorization: "Bearer not-a-real-session" } });
  assert.equal(response.status, 503, `${path}: preview state cannot authenticate`);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.json()).error, "development_service_not_configured");
  console.log(`PASS ${method} ${path}: fail closed without session`);
}
assert.equal((await fetch(new URL("/not-a-real-route", origin))).status, 404);
console.log("PASS unknown route: 404");
