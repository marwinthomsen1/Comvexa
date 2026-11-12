import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import "fake-indexeddb/auto";
import { IDBObjectStore } from "fake-indexeddb";
import {
  templates,
  TEMPLATE_FAMILIES,
  RATIOS,
  filterTemplates,
  getTemplate,
} from "../src/lib/templates/catalog.js";
import {
  generateDesign,
  generatePackage,
  validateCampaign,
} from "../src/lib/templates/generate.js";
import {
  fitText,
  coverCrop,
  documentWarnings,
} from "../src/lib/templates/fitting.js";
import {
  validateDocument,
  newDesign,
  patchElement,
  makeElement,
  exportSpec,
} from "../src/lib/editor/document.js";
import { designStore } from "../src/lib/editor/store.js";
const src = await readFile(
  new URL("../public/images/previews/travel.webp", import.meta.url),
);
const asset = {
  src: `data:image/webp;base64,${src.toString("base64")}`,
  width: 960,
  height: 960,
};
const fields = (f) => ({
  ...f.sample,
  styleId: f.id,
  background: f.background,
  ink: f.ink,
  accent: f.accent,
});
let serial = 0;
const idFactory = () => `qa-design-${++serial}`;
function bundle(id = "qa-package") {
  return generatePackage({
    campaignId: id,
    fields: fields(TEMPLATE_FAMILIES[0]),
    asset,
    assetId: "shared-photo",
    idFactory,
  });
}
// Seed a real v1 IndexedDB layout before the v2 adapter opens it.
await new Promise((resolve, reject) => {
  const r = indexedDB.open("comvexa-designs-v1", 1);
  r.onupgradeneeded = () =>
    r.result.createObjectStore("designs", { keyPath: "id" });
  r.onsuccess = () => {
    const db = r.result,
      t = db.transaction("designs", "readwrite");
    t.objectStore("designs").put({
      id: "legacy-phase-3",
      document: newDesign("Preserved Phase 3"),
      revision: 7,
      updatedAt: "2026-11-12T00:00:00Z",
    });
    t.oncomplete = () => {
      db.close();
      resolve();
    };
    t.onerror = () => reject(t.error);
  };
  r.onerror = () => reject(r.error);
});

test("IndexedDB v1 upgrades without losing Phase 3 documents", async () => {
  const old = await designStore.load("legacy-phase-3");
  assert.equal(old.revision, 7);
  assert.equal(old.document.name, "Preserved Phase 3");
  assert.deepEqual(await designStore.listPackages(), []);
});

test("catalog contains eight curated families, four ratios each and searchable filters", () => {
  assert.equal(templates.length, 32);
  assert.equal(new Set(templates.map((t) => t.id)).size, 32);
  for (const f of TEMPLATE_FAMILIES)
    assert.equal(filterTemplates({ category: f.category }).length, 4);
  assert.equal(filterTemplates({ ratio: "story" }).length, 8);
  assert.equal(filterTemplates({ query: "island" }).length, 4);
  assert.equal(filterTemplates({ query: "nonexistent" }).length, 0);
  assert.throws(() => getTemplate("missing"));
});
test("all templates create editable, validated native documents with distinct compositions", () => {
  const signatures = new Set();
  for (const f of TEMPLATE_FAMILIES) {
    for (const ratio of Object.keys(RATIOS)) {
      const result = generateDesign({
        templateId: `${f.id}-${ratio}`,
        campaignId: "campaign-1",
        fields: fields(f),
        asset,
        assetId: "photo",
      });
      const d = validateDocument(result.document);
      assert.deepEqual(d.canvas, {
        width: RATIOS[ratio].width,
        height: RATIOS[ratio].height,
        background: f.background,
      });
      assert.ok(d.elements.some((e) => e.type === "text"));
      assert.ok(d.elements.some((e) => e.type === "image"));
      assert.equal(
        result.warnings.length,
        0,
        `${f.id}-${ratio}: ${result.warnings}`,
      );
      assert.equal(documentWarnings(d).length, 0, `${f.id}-${ratio}`);
      if (ratio === "square")
        signatures.add(
          JSON.stringify(
            d.elements.map((e) => [e.type, e.x, e.y, e.width, e.height]),
          ),
        );
      for (const format of ["png", "jpeg"])
        assert.equal(exportSpec(d, format, 0.92).width, RATIOS[ratio].width);
    }
  }
  assert.equal(signatures.size, 8);
});
test("package fields share stable campaign references without sharing layout state", () => {
  const b = bundle();
  assert.equal(b.designs.length, 4);
  const ids = new Set();
  for (const d of b.designs) {
    assert.ok(!ids.has(d.id));
    ids.add(d.id);
    for (const field of [
      "name",
      "description",
      "price",
      "contact",
      "link",
      "photo",
    ]) {
      const e = d.document.elements.find((e) => e.binding?.fieldId === field);
      assert.ok(e, field);
      assert.equal(e.binding.campaignId, b.campaign.id);
      assert.equal(e.localOverride, false);
    }
    assert.equal(d.document.provenance.campaignId, b.campaign.id);
  }
  const d = b.designs[0].document;
  const e = d.elements.find((e) => e.binding?.fieldId === "price");
  const changed = patchElement(d, e.id, { text: "My local offer" });
  assert.equal(changed.elements.find((n) => n.id === e.id).localOverride, true);
  assert.equal(
    b.designs[1].document.elements.find((n) => n.binding?.fieldId === "price")
      .localOverride,
    false,
  );
});
test("long text fits or warns, optional fields disappear, special price formats remain text", () => {
  const f = TEMPLATE_FAMILIES[0];
  const input = {
    ...fields(f),
    name: "A".repeat(160),
    description: "A detailed product description with many words. ".repeat(12),
    price: "₱1,299.50 / set",
    contact: "",
    link: "",
  };
  const r = generateDesign({
    templateId: "fashion-landscape",
    campaignId: "long",
    fields: input,
    asset,
    assetId: "photo",
  });
  assert.equal(
    r.document.elements.some((e) => e.binding?.fieldId === "contact"),
    false,
  );
  assert.equal(
    r.document.elements.some((e) => e.binding?.fieldId === "link"),
    false,
  );
  assert.ok(
    r.document.elements
      .find((e) => e.binding?.fieldId === "price")
      .text.includes("₱1,299.50"),
  );
  assert.ok(r.warnings.length > 0 || documentWarnings(r.document).length === 0);
  assert.throws(() => validateCampaign({ ...input, name: "" }));
  assert.throws(() => validateCampaign({ ...input, name: "x".repeat(161) }));
  assert.throws(() =>
    validateCampaign({ ...input, accent: "javascript:alert(1)" }),
  );
  assert.equal(
    fitText(
      "long ".repeat(100),
      { width: 50, height: 20 },
      { min: 20, max: 30 },
    ).overflow,
    true,
  );
});
test("portrait and landscape assets center-crop within source and replacement creates a local override", () => {
  for (const a of [
    { ...asset, width: 1800, height: 900 },
    { ...asset, width: 900, height: 1800 },
  ]) {
    const crop = coverCrop(a, 1080, 1920);
    assert.ok(
      crop.x >= 0 &&
        crop.y >= 0 &&
        crop.x + crop.width <= 1 &&
        crop.y + crop.height <= 1,
    );
  }
  let d = bundle().designs[0].document;
  const e = d.elements.find((e) => e.type === "image");
  d = { ...d, assets: { ...d.assets, replacement: asset } };
  d = patchElement(d, e.id, {
    assetId: "replacement",
    crop: { x: 0, y: 0, width: 1, height: 1 },
  });
  assert.equal(d.elements.find((n) => n.id === e.id).localOverride, true);
  assert.ok(d.assets.replacement);
  assert.ok(!d.assets["shared-photo"]);
  assert.throws(() =>
    generateDesign({
      templateId: "fashion-square",
      campaignId: "bad",
      fields: fields(TEMPLATE_FAMILIES[0]),
      asset: { ...asset, src: "blob:expired" },
      assetId: "bad",
    }),
  );
});
test("package transaction saves campaign plus four designs, reopening and revisions remain editable", async () => {
  const b = bundle("saved-package");
  await designStore.savePackage(b);
  for (const d of b.designs) {
    const saved = await designStore.load(d.id);
    assert.deepEqual(saved.document, d.document);
    assert.equal(saved.revision, 1);
    const e = saved.document.elements.find((e) => e.type === "text");
    await designStore.save(
      d.id,
      patchElement(saved.document, e.id, { text: "Edited after generation" }),
      1,
    );
  }
  assert.ok(
    (await designStore.listPackages()).some((c) => c.id === b.campaign.id),
  );
  await assert.rejects(() => designStore.savePackage(b));
});
test("quota failure rolls back the entire package and leaves previous designs intact", async () => {
  const b = bundle("quota-package");
  const original = IDBObjectStore.prototype.add;
  let n = 0;
  try {
    IDBObjectStore.prototype.add = function (...args) {
      if (++n === 3) throw new DOMException("full", "QuotaExceededError");
      return original.apply(this, args);
    };
    await assert.rejects(() => designStore.savePackage(b), /save failed/i);
  } finally {
    IDBObjectStore.prototype.add = original;
  }
  for (const d of b.designs) assert.equal(await designStore.load(d.id), null);
  assert.ok(
    !(await designStore.listPackages()).some((c) => c.id === b.campaign.id),
  );
  assert.ok(
    (await designStore.listPackages()).some((c) => c.id === "saved-package"),
  );
});
test("Phase 3 documents remain byte-structure compatible and template provenance survives editing", () => {
  const old = newDesign("Phase 3");
  old.elements = [makeElement("text", "old-text")];
  assert.deepEqual(validateDocument(old), old);
  const d = bundle().designs[0].document;
  const next = patchElement(d, d.elements[0].id, { x: 321 });
  assert.deepEqual(next.provenance, d.provenance);
  assert.throws(() =>
    validateDocument({ ...d, provenance: { campaignId: "bad" } }),
  );
});

test("multiple uploaded photos use stable persisted IDs and campaign photo references", () => {
  const photos = [
    { id: "photo-one", asset },
    { id: "photo-two", asset },
  ];
  const b = generatePackage({
    campaignId: "multi",
    fields: fields(TEMPLATE_FAMILIES[1]),
    photos,
    asset,
    assetId: "photo-one",
    idFactory,
  });
  assert.deepEqual(b.campaign.photoIds, ["photo-one", "photo-two"]);
  for (const [i, d] of b.designs.entries()) {
    const image = d.document.elements.find((e) => e.type === "image");
    assert.equal(image.assetId, photos[i % 2].id);
    assert.equal(image.binding.fieldId, `photos.${i % 2}`);
    assert.ok(d.document.assets[image.assetId]);
  }
});

test("important text frames do not overlap across curated default layouts", () => {
  for (const t of templates) {
    const f = TEMPLATE_FAMILIES.find((f) => f.id === t.familyId);
    const { document: d } = generateDesign({
      templateId: t.id,
      campaignId: "layout",
      fields: fields(f),
      asset,
      assetId: "photo",
    });
    const text = d.elements.filter((e) => e.type === "text" && e.binding);
    for (let i = 0; i < text.length; i++)
      for (let j = i + 1; j < text.length; j++) {
        const a = text[i],
          b = text[j];
        const overlaps =
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height - 0.5 &&
          a.y + a.height > b.y + 0.5;
        assert.equal(
          overlaps,
          false,
          `${t.id}: ${a.binding.fieldId} overlaps ${b.binding.fieldId}`,
        );
      }
  }
});
