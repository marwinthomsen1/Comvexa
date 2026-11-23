import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import "fake-indexeddb/auto";
import {
  curatedTemplates,
  CURATED_CATEGORIES,
  CURATED_SIZES,
  filterCuratedTemplates,
} from "../src/lib/templates/curated-catalog.js";
import {
  PHOTO_PATHS,
  generateCurated,
  validateCuratedQuality,
  geometrySignature,
} from "../src/lib/templates/curated-generate.js";
import {
  validateDocument,
  patchElement,
  history,
  commit,
  undo,
  redo,
  exportSpec,
} from "../src/lib/editor/document.js";
import { designStore } from "../src/lib/editor/store.js";
const assets = Object.fromEntries(
  await Promise.all(
    Object.entries(PHOTO_PATHS).map(async ([k, p]) => [
      k,
      {
        src: `data:image/webp;base64,${(await readFile(new URL("../public" + p, import.meta.url))).toString("base64")}`,
        width: 960,
        height: 960,
      },
    ]),
  ),
);
test("100 authored compositions meet exact category quotas with distinct geometry rather than ratio copies", () => {
  assert.equal(curatedTemplates.length, 100);
  assert.equal(new Set(curatedTemplates.map((t) => t.id)).size, 100);
  for (const [id, , count] of CURATED_CATEGORIES)
    assert.equal(
      curatedTemplates.filter((t) => t.category === id).length,
      count,
    );
  const signatures = new Set(
    curatedTemplates.map((t) =>
      geometrySignature(generateCurated(t.id, assets)),
    ),
  );
  assert.equal(signatures.size, 100);
  assert.ok(new Set(curatedTemplates.map((t) => t.style)).size >= 12);
});
test("every curated document validates fonts/colors/schema/ratio/images/bounds, required text, fitting and text-frame separation", () => {
  for (const t of curatedTemplates) {
    const doc = generateCurated(t.id, assets);
    assert.deepEqual(validateDocument(doc), doc, t.id);
    assert.equal(doc.canvas.width, CURATED_SIZES[t.ratio].width);
    assert.equal(doc.canvas.height, CURATED_SIZES[t.ratio].height);
    assert.deepEqual(validateCuratedQuality(doc), [], t.id);
    assert.ok(doc.elements.filter((e) => e.type === "text").length >= 2, t.id);
    for (const e of doc.elements.filter((e) => e.type === "image"))
      assert.ok(doc.assets[e.assetId], t.id);
    for (const format of ["png", "jpeg"])
      assert.equal(exportSpec(doc, format).width, doc.canvas.width);
  }
});
test("all 100 templates edit, undo/redo, persist and reopen without catalog dependencies", async () => {
  for (const t of curatedTemplates) {
    const doc = generateCurated(t.id, assets),
      text = doc.elements.find((e) => e.type === "text");
    let h = history(doc);
    h = commit(h, patchElement(doc, text.id, { text: "My editable design" }));
    assert.equal(
      undo(h).present.elements.find((e) => e.id === text.id).text,
      text.text,
    );
    assert.equal(
      redo(undo(h)).present.elements.find((e) => e.id === text.id).text,
      "My editable design",
    );
    await designStore.save(t.id, h.present, 0);
    const stored = await designStore.loadConnected(t.id);
    assert.deepEqual(stored.document, h.present, t.id);
    assert.ok(
      !stored.document.provenance,
      "saved copies must not need a live template reference",
    );
  }
});
test("discovery combines query/category/format/style and rejects missing image sources rather than inventing assets", () => {
  const results = filterCuratedTemplates({
    category: "events",
    style: "Luxury",
  });
  assert.ok(results.length >= 1);
  assert.ok(
    results.every((t) => t.category === "events" && t.style === "Luxury"),
  );
  assert.ok(
    filterCuratedTemplates({ query: "wedding" }).some(
      (t) => t.id === "studio-wedding",
    ),
  );
  assert.equal(
    filterCuratedTemplates({ query: "nothing-match-xyz" }).length,
    0,
  );
  assert.throws(() => generateCurated("missing", assets));
  assert.throws(
    () => generateCurated("studio-open-road", {}),
    /Missing original photo/,
  );
});
test("lightweight gallery metadata is synchronized with actual design documents", async () => {
  const metadata = JSON.parse(
    await readFile(
      new URL("../src/lib/templates/curated-metadata.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(
    metadata.templates.map((t) => t.id),
    curatedTemplates.map((t) => t.id),
  );
  assert.ok(metadata.templates.every((t) => !t.commands && !t.palette));
  assert.deepEqual(metadata.categories, CURATED_CATEGORIES);
  assert.deepEqual(metadata.sizes, CURATED_SIZES);
  assert.deepEqual(metadata.templates, curatedTemplates.map(t => Object.fromEntries(Object.entries(t).filter(([key]) => !["commands", "palette"].includes(key)))));
});

test("every gallery thumbnail is a real optimized WebP within the thumbnail byte budget", async () => {
  let bytes = 0;
  for (const t of curatedTemplates) {
    const data = await readFile(new URL(`../public/images/templates/${t.id}.webp`, import.meta.url));
    assert.equal(data.toString("ascii",0,4), "RIFF");
    assert.equal(data.toString("ascii",8,12), "WEBP");
    assert.ok(data.length < 80000, `${t.id} thumbnail exceeds budget`);
    bytes += data.length;
  }
  assert.ok(bytes < 2 * 1024 * 1024);
});

test("quality checks reject regression fixtures for clipping, bounds, missing references, fonts and colors", () => {
  const original = generateCurated("studio-daily-note", assets);
  const doc = structuredClone(original), text = doc.elements.find(e=>e.type === "text");
  text.x = doc.canvas.width;
  assert.ok(validateCuratedQuality(doc).some(i=>i.includes("outside canvas")));
  for (const patch of [{fontFamily:"Unknown Font"}, {fill:"no-color"}]) {
    const invalid = structuredClone(original);
    Object.assign(invalid.elements.find(e=>e.type === "text"), patch);
    assert.throws(()=>validateDocument(invalid));
  }
  const photo = generateCurated("studio-open-road", assets);
  photo.assets = {};
  assert.throws(()=>validateDocument(photo));
  const clipped = structuredClone(original);
  const headline = clipped.elements.find(e=>e.type === "text");
  headline.text = "Oversized content ".repeat(80); headline.width = 30; headline.height = 20;
  assert.ok(validateCuratedQuality(clipped).length > 0);
});


// Exercise the exact lightweight index used by the marketplace UI.
import { discoverTemplates } from "../src/lib/templates/discovery.js";
test("marketplace metadata search discovers wedding intent and combines all filters", () => {
 assert.deepEqual(discoverTemplates({query:"wedding"}).map(t=>t.id), ["studio-wedding"]);
 assert.equal(discoverTemplates({query:"wedding",category:"food"}).length,0);
 assert.equal(discoverTemplates({query:"wedding",category:"events",ratio:"invitation",style:"Luxury"}).length,1);
 const resumes=discoverTemplates({query:"résumé"});
 assert.ok(resumes.length>=1);
 assert.deepEqual(resumes,discoverTemplates({query:"resume"}));
 assert.ok(resumes.some(t=>t.id==="studio-cv"));
 assert.deepEqual(discoverTemplates({query:"  wedding   luxury  "}),discoverTemplates({query:"luxury wedding"}));
 assert.ok(discoverTemplates({query:"wedding luxury"}).some(t=>t.id==="studio-wedding"));
 assert.equal(discoverTemplates({query:"nothing-match-xyz"}).length,0);
});
