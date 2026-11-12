import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import "fake-indexeddb/auto";
import { IDBObjectStore } from "fake-indexeddb";
import {
  newDesign,
  makeElement,
  validateDocument,
  addElement,
  patchElement,
  reorder,
  history,
  commit,
  undo,
  redo,
  exportSpec,
  snapPosition,
  PRESETS,
} from "../src/lib/editor/document.js";
import { inspectImage, MAX_IMAGE_BYTES } from "../src/lib/editor/images.js";
import { designStore } from "../src/lib/editor/store.js";
test("create designs and validate presets, geometry, types, content and bindings", () => {
  for (const [w, h] of Object.values(PRESETS))
    assert.equal(validateDocument(newDesign("Test", w, h)).canvas.height, h);
  for (const width of [0, 63, 4097, Infinity, 100.5])
    assert.throws(() => newDesign("Bad", width, 100));
  let d = addElement(newDesign(), makeElement("text", "text-1"));
  d = patchElement(d, "text-1", {
    text: "₱850",
    binding: { campaignId: "launch", fieldId: "price" },
    localOverride: true,
  });
  assert.equal(d.elements[0].text, "₱850");
  assert.equal(d.elements[0].localOverride, true);
  assert.throws(() => validateDocument({ ...d, schemaVersion: 999 }));
  assert.throws(() => addElement(d, d.elements[0]));
  assert.throws(() => patchElement(d, "text-1", { type: "html" }));
  assert.throws(() => patchElement(d, "text-1", { fontFamily: "url(evil)" }));
  assert.throws(() => patchElement(d, "text-1", { width: NaN }));
  assert.throws(() => patchElement(d, "text-1", { binding: { fieldId: 12 } }));
});
test("move, resize, rotate, duplicate, layer order, delete and undo/redo restore stable geometry", () => {
  let d = addElement(newDesign(), makeElement("rect", "shape-1"));
  let s = history(d);
  s = commit(
    s,
    patchElement(s.present, "shape-1", {
      x: 321,
      y: 250,
      width: 600,
      height: 200,
      rotation: 30,
    }),
  );
  assert.equal(s.present.elements[0].width, 600);
  const moved = s.present;
  s = commit(
    s,
    addElement(s.present, { ...s.present.elements[0], id: "shape-2" }),
  );
  s = commit(s, reorder(s.present, "shape-2", -1));
  assert.equal(s.present.elements[0].id, "shape-2");
  s = undo(s);
  assert.equal(s.present.elements.at(-1).id, "shape-2");
  s = undo(s);
  assert.deepEqual(s.present, moved);
  s = undo(s);
  assert.equal(s.present.elements[0].x, 80);
  s = redo(s);
  assert.deepEqual(s.present, moved);
  s = commit(s, { ...s.present, elements: [] });
  assert.equal(s.future.length, 0);
  assert.equal(undo(s).present.elements.length, 1);
  for (let n = 0; n < 45; n++)
    s = commit(s, { ...s.present, name: `Revision ${n}` });
  assert.equal(s.past.length, 30);
});
test("alignment aids snap edges and centers without changing rotated geometry", () => {
  const d = newDesign();
  const e = { ...makeElement("rect", "one"), x: 3, y: 301 };
  assert.equal(snapPosition(e, d).x, 0);
  assert.equal(snapPosition({ ...e, rotation: 10 }, d).x, 3);
});
test("local IndexedDB save/reopen retains elements/assets and rejects conflicting tabs", async () => {
  const d = addElement(newDesign("Reopen"), makeElement("text", "text-1"));
  let rev = await designStore.save("qa-roundtrip", d, 0);
  assert.equal(rev, 1);
  let record = await designStore.load("qa-roundtrip");
  assert.deepEqual(record.document, d);
  const changed = patchElement(d, "text-1", {
    text: "Changed after reopening",
    x: 77,
  });
  rev = await designStore.save("qa-roundtrip", changed, rev);
  assert.equal(rev, 2);
  await assert.rejects(
    () => designStore.save("qa-roundtrip", d, 1),
    /another tab/,
  );
  assert.equal(
    (await designStore.load("qa-roundtrip")).document.elements[0].x,
    77,
  );
  assert.ok((await designStore.list()).some((i) => i.id === "qa-roundtrip"));
});
test("storage failures reject, invalid documents never persist", async () => {
  await assert.rejects(() => designStore.save("bad", { schemaVersion: 9 }, 0));
  const factory = globalThis.indexedDB;
  try {
    globalThis.indexedDB = {
      open() {
        throw new Error("Storage disabled");
      },
    };
    await assert.rejects(() => designStore.load("any"), /Storage disabled/);
    await assert.rejects(
      () => designStore.save("any", newDesign(), 0),
      /Storage disabled/,
    );
  } finally {
    globalThis.indexedDB = factory;
  }
});
test("image validation rejects mismatched MIME, script formats, corruption, oversize and giant dimensions", async () => {
  const png = new Uint8Array(24);
  png.set([137, 80, 78, 71, 13, 10, 26, 10]);
  new DataView(png.buffer).setUint32(16, 100);
  new DataView(png.buffer).setUint32(20, 200);
  assert.equal(inspectImage(png, "image/png").width, 100);
  assert.throws(() => inspectImage(png, "image/jpeg"));
  new DataView(png.buffer).setUint32(16, 99999);
  assert.throws(() => inspectImage(png, "image/png"));
  assert.throws(() =>
    inspectImage(
      new TextEncoder().encode('<svg onload="alert(1)"></svg>'),
      "image/svg+xml",
    ),
  );
  assert.throws(() =>
    inspectImage(new Uint8Array(MAX_IMAGE_BYTES + 1), "image/png"),
  );
  assert.throws(() => inspectImage(new Uint8Array(50), "image/png"));
  const webp = new Uint8Array(
    await readFile(
      new URL("../public/images/previews/fashion.webp", import.meta.url),
    ),
  );
  assert.equal(inspectImage(webp, "image/webp").width, 960);
  let d = newDesign();
  assert.throws(() =>
    validateDocument({
      ...d,
      assets: {
        bad: {
          src: "https://example.com/tracker.png",
          width: 100,
          height: 100,
        },
      },
    }),
  );
});
test("image crop remains within source and exports use exact document pixels", () => {
  const d = newDesign("Export", 1200, 630);
  d.assets.asset = {
    src: "data:image/png;base64,AAAA",
    width: 100,
    height: 100,
  };
  let e = {
    ...makeElement("image", "image-1"),
    assetId: "asset",
    crop: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
  };
  const next = addElement(d, e);
  assert.throws(() =>
    patchElement(next, e.id, { crop: { x: 0.5, y: 0, width: 1, height: 1 } }),
  );
  for (const format of ["png", "jpeg"])
    assert.deepEqual(exportSpec(next, format, 0.92), {
      width: 1200,
      height: 630,
      mimeType: `image/${format}`,
      quality: 0.92,
      pixelRatio: 1,
    });
  assert.throws(() => exportSpec(next, "svg"));
  assert.throws(() => exportSpec(next, "png", 100));
});

test("quota failure preserves the last successful design revision", async () => {
  const original = IDBObjectStore.prototype.put;
  const d = newDesign("Quota QA");
  await designStore.save("qa-quota", d, 0);
  try {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("Full", "QuotaExceededError");
    };
    await assert.rejects(
      () => designStore.save("qa-quota", { ...d, name: "Unsaved edit" }, 1),
      /save failed/,
    );
  } finally {
    IDBObjectStore.prototype.put = original;
  }
  const reopened = await designStore.load("qa-quota");
  assert.equal(reopened.document.name, "Quota QA");
  assert.equal(reopened.revision, 1);
});
