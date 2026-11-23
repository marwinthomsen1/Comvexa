import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  validateAuth,
  unavailableResponse,
} from "../src/lib/auth/foundation.js";
import {
  validateDraft,
  validateProfile,
} from "../src/lib/workspace/validation.js";
import {
  emptyWorkspace,
  addDraft,
  readWorkspace,
  writeWorkspace,
  STORAGE_KEY,
} from "../src/lib/workspace/local-store.js";
import { createBlankDocument } from "../src/lib/design-document/schema.js";

test("auth fails closed without fabricating a session or accepting a local workspace as identity", async () => {

  const response = unavailableResponse();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(
    (await response.json()).error,
    "development_service_not_configured",
  );
});
test("auth validation rejects malformed email, short/oversized passwords and unknown actions", () => {
  assert.throws(() =>
    validateAuth("login", { email: "wrong", password: "not-a-real-password" }),
  );
  assert.throws(() =>
    validateAuth("register", {
      displayName: "",
      email: "test@example.com",
      password: "not-a-real-password",
    }),
  );
  for (const password of ["short", "x".repeat(129)])
    assert.throws(() =>
      validateAuth("login", { email: "test@example.com", password }),
    );
  assert.throws(() =>
    validateAuth("admin", {
      email: "test@example.com",
      password: "not-a-real-password",
    }),
  );
  assert.deepEqual(
    validateAuth("register", {
      displayName: "Test",
      email: "test@example.com",
      password: "not-a-real-password",
    }),
    { email: "test@example.com" },
  );
});
test("drafts validate format, lengths and local parent existence", () => {
  assert.throws(() => validateDraft("project", { name: "", size: "square" }));
  assert.throws(() =>
    validateDraft("project", { name: "Valid", size: "toString" }),
  );
  assert.throws(() =>
    validateDraft("project", {
      name: "Valid",
      size: "square",
      campaignId: "someone-else",
    }),
  );
  assert.throws(() => validateDraft("campaign", { name: "x".repeat(81) }));
  assert.throws(() => validateProfile({ displayName: "", bio: "" }));
  assert.deepEqual(
    validateDraft("project", { name: "  New idea ", size: "square" }),
    { name: "New idea", description: "", size: "square", campaignId: null },
  );
});
test("local workspace round-trips, preserves campaign links and refuses corrupt data", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  let data = emptyWorkspace();
  data = addDraft(
    data,
    "campaign",
    { name: "Launch" },
    "campaign-1",
    "2026-11-12T00:00:00Z",
  );
  data = addDraft(
    data,
    "project",
    { name: "Post", size: "story", campaignId: "campaign-1" },
    "project-1",
    "2026-11-12T00:00:00Z",
  );
  writeWorkspace(storage, data);
  assert.deepEqual(readWorkspace(storage), data);
  values.set(STORAGE_KEY, "{broken");
  assert.throws(() => readWorkspace(storage));
  assert.equal(values.get(STORAGE_KEY), "{broken");
  values.set(STORAGE_KEY, JSON.stringify({ ...data, version: 99 }));
  assert.throws(() => readWorkspace(storage));
});
test("storage quota errors propagate rather than claiming save success", () => {
  assert.throws(
    () =>
      writeWorkspace(
        {
          setItem: () => {
            throw new Error("quota");
          },
        },
        emptyWorkspace(),
      ),
    /quota/,
  );
});
test("future document schema is renderer independent and bounds canvas dimensions", () => {
  assert.deepEqual(createBlankDocument(1080, 1080).bindings, []);
  assert.throws(() => createBlankDocument(100000, 1080));
});

test("actual PostgreSQL RLS isolates users, guests, ownership changes and campaign references", async () => {
  const db = new PGlite();
  const A = "00000000-0000-4000-8000-000000000001",
    B = "00000000-0000-4000-8000-000000000002";
  const campaign = "10000000-0000-4000-8000-000000000001",
    project = "20000000-0000-4000-8000-000000000001";
  try {
    await db.exec(
      await readFile(
        new URL("../supabase/tests/bootstrap.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202611120001_creative_foundation.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    async function as(user) {
      await db.exec("reset role; set role authenticated;");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        user,
      ]);
    }
    await as(A);
    await db.query("insert into profiles(id,display_name) values ($1,$2)", [
      A,
      "Alice",
    ]);
    await db.query(
      "insert into campaigns(id,owner_id,name) values ($1,$2,$3)",
      [campaign, A, "Private launch"],
    );
    await db.query(
      "insert into projects(id,owner_id,campaign_id,name,canvas_format) values ($1,$2,$3,$4,$5)",
      [project, A, campaign, "Private post", "square"],
    );
    assert.equal((await db.query("select * from projects")).rows.length, 1);
    await assert.rejects(() =>
      db.query("update projects set owner_id=$1 where id=$2", [B, project]),
    );
    await as(B);
    for (const table of ["projects", "campaigns", "profiles"])
      assert.equal(
        (await db.query(`select * from ${table}`)).rows.length,
        0,
        table,
      );
    assert.equal(
      (
        await db.query("update projects set name=$1 where id=$2 returning id", [
          "Stolen",
          project,
        ])
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query("delete from projects where id=$1 returning id", [
          project,
        ])
      ).rows.length,
      0,
    );
    await assert.rejects(() =>
      db.query(
        "insert into projects(owner_id,name,canvas_format) values ($1,$2,$3)",
        [A, "Spoof", "square"],
      ),
    );
    await assert.rejects(() =>
      db.query("insert into profiles(id,display_name) values ($1,$2)", [
        A,
        "Spoof",
      ]),
    );
    await assert.rejects(() =>
      db.query("insert into campaigns(owner_id,name) values ($1,$2)", [
        A,
        "Spoof",
      ]),
    );
    await assert.rejects(() =>
      db.query(
        "insert into projects(owner_id,campaign_id,name,canvas_format) values ($1,$2,$3,$4)",
        [B, campaign, "Cross-user parent", "square"],
      ),
    );
    await db.query(
      "insert into projects(owner_id,name,canvas_format) values ($1,$2,$3)",
      [B, "My post", "portrait"],
    );
    await as("");
    assert.equal((await db.query("select * from projects")).rows.length, 0);
    await db.exec("reset role; set role anon;");
    await assert.rejects(() => db.query("select * from projects"));
    await assert.rejects(() =>
      db.query("insert into campaigns(owner_id,name) values ($1,$2)", [
        B,
        "Guest insert",
      ]),
    );
    await as(A);
    assert.equal(
      (await db.query("select name from projects where id=$1", [project]))
        .rows[0].name,
      "Private post",
    );
    await db.query("delete from projects where id=$1", [project]);
    assert.equal((await db.query("select * from projects")).rows.length, 0);
  } finally {
    await db.close();
  }
});
