import assert from "node:assert/strict";
const origin = process.env.COMVEXA_TEST_ORIGIN || "http://127.0.0.1:3000";
const url = new URL(origin);
assert.ok(
  ["127.0.0.1", "localhost"].includes(url.hostname),
  "HTTP tests must target loopback, never production.",
);
for (const path of [
  "/",
  "/login",
  "/register",
  "/dashboard",
  "/dashboard/projects",
  "/dashboard/designs",
  "/dashboard/campaigns",
  "/dashboard/settings",
  "/dashboard/start",
  "/dashboard/backups",
  "/dashboard/templates",
  "/dashboard/packages",
  "/dashboard/connected/qa-campaign",
  "/editor",
  "/editor/new",
  "/editor/qa-route",
]) {
  const response = await fetch(new URL(path, origin));
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.ok(html.includes("noindex"), `${path}: preview must stay noindex`);
  console.log(`PASS ${path}: 200`);
}
for (const [path, method] of [
  ["/api/projects", "GET"],
  ["/api/projects", "POST"],
]) {
  const response = await fetch(new URL(path, origin), {
    method,
    headers: {
      Cookie: "preview_user=spoofed",
      Authorization: "Bearer not-a-real-session",
    },
  });
  assert.equal(
    response.status,
    503,
    `${path}: preview state cannot authenticate`,
  );
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(
    (await response.json()).error,
    "development_service_not_configured",
  );
  console.log(`PASS ${method} ${path}: fail closed without session`);
}
assert.equal((await fetch(new URL("/not-a-real-route", origin))).status, 404);
console.log("PASS unknown route: 404");

for (const [path,target] of [["/editor","/dashboard/designs"],["/editor/new","/dashboard/designs?create=1"]]) {
 const response=await fetch(new URL(path,origin),{redirect:"manual"});
 assert.equal(response.status,307);assert.equal(response.headers.get("location"),target);console.log(`PASS ${path}: redirects to ${target}`);
}

const auth=await fetch(new URL('/api/auth',origin),{headers:{Cookie:'preview_user=spoofed',Authorization:'Bearer not-a-session'}});
const account=await auth.json(),enabled=account.configured===true;
assert.equal(auth.status,enabled?200:503);if(enabled)assert.equal(account.user,null);
for(const [path,method,status] of [['/api/auth','POST',enabled?403:503],['/api/cloud-backups','GET',enabled?401:503],['/api/account-sync','GET',enabled?401:503],['/api/account-sync','POST',enabled?403:503],['/api/account-sync','PUT',enabled?403:503],['/api/cloud-backups','POST',enabled?403:503]]){const response=await fetch(new URL(path,origin),{method,headers:{Cookie:'preview_user=spoofed',Authorization:'Bearer fake'}});assert.equal(response.status,status,path);assert.equal(response.headers.get('cache-control'),'no-store');console.log(`PASS ${method} ${path}: rejects unauthenticated or untrusted requests`);}
