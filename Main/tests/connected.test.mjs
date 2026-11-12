import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import "fake-indexeddb/auto";
import { IDBObjectStore } from "fake-indexeddb";
import { designStore } from "../src/lib/editor/store.js";
import { generatePackage } from "../src/lib/templates/generate.js";
import { getFamily } from "../src/lib/templates/catalog.js";
import {
  normalizeCampaign,
  resolveDocument,
  connectElement,
  connectionAction,
  parsePortable,
} from "../src/lib/connected/model.js";
import {
  patchElement,
  newDesign,
  makeElement,
  history,
  commit,
  undo,
  redo,
  exportSpec,
  validateDocument,
} from "../src/lib/editor/document.js";
const file = await readFile(
  new URL("../public/images/previews/motorcycle.webp", import.meta.url),
);
const asset = {
  src: `data:image/webp;base64,${file.toString("base64")}`,
  width: 960,
  height: 960,
};
let serial = 0;
async function fixture() {
  const id = `connected-${++serial}`,
    f = getFamily("motors");
  const b = generatePackage({
    campaignId: id,
    fields: {
      ...f.sample,
      styleId: f.id,
      background: f.background,
      ink: f.ink,
      accent: f.accent,
      price: "₱950",
    },
    asset,
    assetId: `photo-${id}`,
    idFactory: () => `design-${++serial}`,
  });
  await designStore.savePackage(b);
  return designStore.campaignSnapshot(id);
}
const change = (campaign, id, value) => ({
  ...campaign,
  sharedFields: campaign.sharedFields.map((f) =>
    f.id === id ? { ...f, value } : f,
  ),
});
const price = (d) => d.elements.find((e) => e.binding?.fieldId === "price");
const layout = (d) =>
  d.elements.map(
    ({
      id,
      type,
      x,
      y,
      width,
      height,
      rotation,
      opacity,
      fontFamily,
      fontSize,
      fontWeight,
      fill,
      lineHeight,
      align,
      crop,
    }) => ({
      id,
      type,
      x,
      y,
      width,
      height,
      rotation,
      opacity,
      fontFamily,
      fontSize,
      fontWeight,
      fill,
      lineHeight,
      align,
      crop,
    }),
  );
test("acceptance: motorcycle price 950→850 updates four designs atomically with identical layouts, then respects a 799 override", async () => {
  const before = await fixture();
  const after = await designStore.updateCampaign(
    before.campaign.id,
    change(before.campaign, "price", "₱850"),
    0,
  );
  assert.equal(after.campaign.revision, 1);
  for (const r of after.records) {
    assert.equal(price(r.document).text, "₱850");
    assert.deepEqual(
      layout(r.document),
      layout(before.records.find((b) => b.id === r.id).document),
    );
    const reopened = await designStore.loadConnected(r.id);
    assert.equal(price(reopened.document).text, "₱850");
    assert.equal(reopened.revision, 2);
  }
  const fourth = after.records[3];
  const local = patchElement(fourth.document, price(fourth.document).id, {
    text: "₱799",
  });
  await designStore.save(fourth.id, local, fourth.revision);
  const next = await designStore.updateCampaign(
    after.campaign.id,
    change(after.campaign, "price", "₱800"),
    1,
  );
  assert.deepEqual(
    next.records.map((r) => price(r.document).text),
    ["₱800", "₱800", "₱800", "₱799"],
  );
  for (const r of next.records) {
    const snap = await designStore.exportSnapshot(r.id, r.document, r.revision);
    assert.equal(snap.revisions[before.campaign.id], 2);
    assert.equal(
      price(snap.document).text,
      r.id === fourth.id ? "₱799" : "₱800",
    );
    for (const f of ["png", "jpeg"])
      assert.equal(
        exportSpec(snap.document, f, 0.92).width,
        r.document.canvas.width,
      );
  }
});
test("custom field IDs survive rename; linked text, override, empty override, restore and remove are explicit", async () => {
  const s = await fixture();
  let c = {
    ...s.campaign,
    sharedFields: [
      ...s.campaign.sharedFields,
      {
        id: "custom-opening",
        label: "Opening hours",
        type: "text",
        value: "9 AM–6 PM",
      },
    ],
  };
  let saved = await designStore.updateCampaign(c.id, c, 0);
  let d = saved.records[0].document;
  const e = d.elements.find((e) => e.type === "text");
  d = connectElement(d, e.id, saved.campaign, "custom-opening");
  assert.equal(d.elements.find((n) => n.id === e.id).text, "9 AM–6 PM");
  await designStore.save(saved.records[0].id, d, saved.records[0].revision);
  c = {
    ...saved.campaign,
    sharedFields: saved.campaign.sharedFields.map((f) =>
      f.id === "custom-opening"
        ? { ...f, label: "Store hours", value: "10 AM–7 PM" }
        : f,
    ),
  };
  saved = await designStore.updateCampaign(c.id, c, 1);
  d = saved.records[0].document;
  assert.equal(
    d.elements.find((n) => n.id === e.id).binding.fieldId,
    "custom-opening",
  );
  assert.equal(d.elements.find((n) => n.id === e.id).text, "10 AM–7 PM");
  d = connectionAction(d, e.id, "override", [saved.campaign]);
  d = patchElement(d, e.id, { text: "" });
  assert.equal(
    resolveDocument(d, [saved.campaign]).document.elements.find(
      (n) => n.id === e.id,
    ).text,
    "",
  );
  d = connectionAction(d, e.id, "restore", [saved.campaign]);
  assert.equal(d.elements.find((n) => n.id === e.id).text, "10 AM–7 PM");
  d = connectionAction(d, e.id, "detach", [saved.campaign]);
  assert.equal(d.elements.find((n) => n.id === e.id).binding, null);
  assert.equal(d.elements.find((n) => n.id === e.id).text, "10 AM–7 PM");
});
test("safe referenced-field removal requires explicit detachment and preserves visible content including overrides", async () => {
  const s = await fixture();
  const next = {
    ...s.campaign,
    sharedFields: s.campaign.sharedFields.filter((f) => f.id !== "price"),
  };
  await assert.rejects(
    () => designStore.updateCampaign(s.campaign.id, next, 0),
    /detach/,
  );
  const result = await designStore.updateCampaign(s.campaign.id, next, 0, {
    detachFields: ["price"],
  });
  for (const r of result.records) {
    const p = r.document.elements.find((e) => e.text === "₱950");
    assert.ok(p);
    assert.equal(p.binding, null);
  }
  const broken = {
    ...s.records[0].document,
    elements: s.records[0].document.elements.map((e) =>
      e.binding?.fieldId === "price"
        ? { ...e, binding: { ...e.binding, fieldId: "missing" } }
        : e,
    ),
  };
  assert.throws(() => resolveDocument(broken, [s.campaign]), /missing/i);
  assert.ok(
    resolveDocument(broken, [s.campaign], { strict: false }).warnings.length,
  );
});
test("shared photo replacement preserves per-design geometry/crops and image overrides", async () => {
  const s = await fixture();
  const last = s.records.at(-1),
    img = last.document.elements.find((e) => e.type === "image");
  await designStore.save(
    last.id,
    connectionAction(last.document, img.id, "override", [s.campaign]),
    last.revision,
  );
  const c = {
    ...s.campaign,
    assets: { ...s.campaign.assets, replacement: asset },
    sharedFields: s.campaign.sharedFields.map((f) =>
      f.type === "image" ? { ...f, value: "replacement" } : f,
    ),
  };
  const result = await designStore.updateCampaign(c.id, c, 0);
  for (const r of result.records) {
    const current = r.document.elements.find((e) => e.type === "image");
    assert.deepEqual(
      layout(r.document),
      layout(s.records.find((n) => n.id === r.id).document),
    );
    assert.equal(
      current.assetId,
      r.id === last.id ? img.assetId : "replacement",
    );
  }
});
test("rapid writes and stale autosave/export revisions fail visibly without losing the committed campaign", async () => {
  const s = await fixture();
  const attempts = await Promise.allSettled([
    designStore.updateCampaign(
      s.campaign.id,
      change(s.campaign, "price", "₱850"),
      0,
    ),
    designStore.updateCampaign(
      s.campaign.id,
      change(s.campaign, "price", "₱700"),
      0,
    ),
  ]);
  assert.equal(attempts.filter((a) => a.status === "fulfilled").length, 1);
  assert.equal(attempts.filter((a) => a.status === "rejected").length, 1);
  await assert.rejects(
    () => designStore.save(s.records[0].id, s.records[0].document, 1),
    /changed/,
  );
  await assert.rejects(
    () => designStore.exportSnapshot(s.records[0].id, s.records[0].document, 1),
    /changed/,
  );
  const current = await designStore.campaignSnapshot(s.campaign.id);
  assert.equal(current.campaign.revision, 1);
  const staleText = {
    ...current.records[0].document,
    elements: current.records[0].document.elements.map((e) =>
      e.binding?.fieldId === "price" ? { ...e, text: "stale cached text" } : e,
    ),
  };
  await designStore.save(
    current.records[0].id,
    staleText,
    current.records[0].revision,
  );
  assert.equal(
    price((await designStore.loadConnected(current.records[0].id)).document)
      .text,
    current.campaign.sharedFields.find((f) => f.id === "price").value,
  );
});
test("interrupted/quota campaign updates roll back every design and campaign revision", async () => {
  const s = await fixture(),
    put = IDBObjectStore.prototype.put;
  let calls = 0;
  try {
    IDBObjectStore.prototype.put = function (...args) {
      if (++calls === 3)
        throw new DOMException("Interrupted", "QuotaExceededError");
      return put.apply(this, args);
    };
    await assert.rejects(
      () =>
        designStore.updateCampaign(
          s.campaign.id,
          change(s.campaign, "price", "₱850"),
          0,
        ),
      /failed/,
    );
  } finally {
    IDBObjectStore.prototype.put = put;
  }
  const reopened = await designStore.campaignSnapshot(s.campaign.id);
  assert.equal(reopened.campaign.revision, 0);
  for (const r of reopened.records) {
    assert.equal(r.revision, 1);
    assert.equal(price(r.document).text, "₱950");
  }
});
test("undo/redo changes local override state and resolves current shared values, not stale history text", async () => {
  const s = await fixture(),
    d = s.records[0].document,
    p = price(d);
  let h = history(d);
  h = commit(h, patchElement(d, p.id, { text: "₱799" }));
  const newer = change(s.campaign, "price", "₱850");
  const undone = resolveDocument(undo(h).present, [newer]).document;
  assert.equal(price(undone).text, "₱850");
  assert.equal(price(undone).localOverride, false);
  const redone = resolveDocument(redo(undo(h)).present, [newer]).document;
  assert.equal(price(redone).text, "₱799");
  assert.equal(price(redone).localOverride, true);
});
test("portable project embeds validated campaign snapshot, imports independently, and rejects scripts or broken references", async () => {
  const s = await fixture();
  const value = await designStore.portable(s.records[0].document);
  const parsed = parsePortable(JSON.parse(JSON.stringify(value)));
  assert.equal(parsed.campaigns[0].id, s.campaign.id);
  const imported = await designStore.importConnected(
    "imported-copy",
    value,
    0,
    () => `imported-${s.campaign.id}`,
  );
  assert.notEqual(price(imported.document).binding.campaignId, s.campaign.id);
  assert.equal(price(imported.document).text, "₱950");
  const c = imported.campaigns[0];
  await designStore.updateCampaign(c.id, change(c, "price", "₱850"), 0);
  assert.equal(
    price((await designStore.loadConnected("imported-copy")).document).text,
    "₱850",
  );
  assert.equal(
    price((await designStore.loadConnected(s.records[0].id)).document).text,
    "₱950",
  );
  assert.throws(
    () => parsePortable({ ...value, campaigns: [] }),
    /unavailable/,
  );
  assert.throws(() =>
    normalizeCampaign({
      ...s.campaign,
      sharedFields: [
        { id: "x", label: "Unsafe", type: "html", value: "<script>" },
      ],
    }),
  );
  assert.throws(() =>
    parsePortable({
      ...value,
      document: {
        ...value.document,
        assets: {
          bad: {
            src: "data:image/svg+xml;base64,AAAA",
            width: 100,
            height: 100,
          },
        },
      },
    }),
  );
});
test("older independent Phase 3 and connected Phase 4 documents remain valid and uppercase layout conventions survive updates", async () => {
  const blank = newDesign("Old independent");
  assert.deepEqual(validateDocument(blank), blank);
  const s = await fixture();
  const result = await designStore.updateCampaign(
    s.campaign.id,
    change(s.campaign, "name", "Open road tomorrow"),
    0,
  );
  for (const r of result.records) {
    const e = r.document.elements.find((e) => e.binding?.fieldId === "name");
    assert.equal(e.text, "OPEN ROAD TOMORROW");
    assert.equal(e.binding.transform, "uppercase");
  }
  const standalone = {
    ...blank,
    elements: [makeElement("text", "independent")],
  };
  await designStore.save("old-independent", standalone, 0);
  assert.deepEqual(
    (await designStore.loadConnected("old-independent")).document,
    standalone,
  );
});

test("different shared-image aspect ratios adapt crop framing without stretching the image frame", async () => {
  const s = await fixture();
  const nextAsset = { ...asset, width: 1600, height: 900 };
  const c = {
    ...s.campaign,
    assets: { ...s.campaign.assets, wide: nextAsset },
    sharedFields: s.campaign.sharedFields.map((f) =>
      f.type === "image" ? { ...f, value: "wide" } : f,
    ),
  };
  const result = await designStore.updateCampaign(c.id, c, 0);
  for (const r of result.records) {
    const e = r.document.elements.find((e) => e.type === "image");
    assert.ok(
      Math.abs(
        (e.crop.width * 1600) / (e.crop.height * 900) - e.width / e.height,
      ) < 0.00001,
    );
    assert.ok(
      e.crop.x >= 0 &&
        e.crop.y >= 0 &&
        e.crop.x + e.crop.width <= 1.00001 &&
        e.crop.y + e.crop.height <= 1.00001,
    );
  }
});
