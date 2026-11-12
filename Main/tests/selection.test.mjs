import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import {
  newDesign,
  makeElement,
  validateDocument,
  history,
  commit,
  undo,
  redo,
} from "../src/lib/editor/document.js";
import {
  selectElement,
  expandSelection,
  editableIds,
  marqueeSelection,
  elementBounds,
  bounds,
  groupSelection,
  ungroupSelection,
  deleteSelection,
  moveSelection,
  transformSelection,
  alignSelection,
  distributeSelection,
  patchSelection,
  reorderSelection,
  snapSelection,
  shortcutAction,
} from "../src/lib/editor/selection.js";
import {
  clipboardPayload,
  parseClipboard,
  pasteSelection,
  writeClipboard,
  readClipboard,
} from "../src/lib/editor/clipboard.js";
import { designStore } from "../src/lib/editor/store.js";
import { resolveDocument } from "../src/lib/connected/model.js";
const make = () =>
  validateDocument({
    ...newDesign("Stage B"),
    elements: [
      { ...makeElement("rect", "one"), x: 20, y: 30, width: 100, height: 60 },
      {
        ...makeElement("text", "two"),
        x: 250,
        y: 160,
        width: 180,
        height: 100,
        fontSize: 30,
      },
      {
        ...makeElement("ellipse", "three"),
        x: 700,
        y: 300,
        width: 100,
        height: 80,
      },
    ],
  });
const ids = ["one", "two", "three"];
let count = 0;
const uid = () => `clipboard-${++count}`;
test("shift/touch toggle, group expansion, marquee, select all inputs and clear work across types", () => {
  let d = make();
  assert.deepEqual(selectElement(d, [], "one"), ["one"]);
  assert.deepEqual(selectElement(d, ["one"], "two", true), ["one", "two"]);
  assert.deepEqual(selectElement(d, ["one", "two"], "one", true), ["two"]);
  assert.deepEqual(selectElement(d, ids, null), []);
  assert.deepEqual(
    marqueeSelection(d, { x: 0, y: 0, width: 500, height: 300 }),
    ["one", "two"],
  );
  d = groupSelection(d, ["one", "two"], "group-a");
  assert.deepEqual(expandSelection(d, ["two"]), ["one", "two"]);
  assert.deepEqual(selectElement(d, ["one", "two"], "one", true), []);
  d = patchSelection(d, ["one"], { locked: true }, { includeProtected: true });
  assert.deepEqual(editableIds(d, ids), ["three"]);
  assert.deepEqual(
    marqueeSelection(d, { x: 0, y: 0, width: 500, height: 300 }),
    [],
  );
});
test("grouping upgrades only the edited document; transforms preserve relative positions, styles and bindings; undo/redo and ungroup retain artwork", () => {
  const original = make();
  let d = groupSelection(original, ["one", "two"], "group-a");
  assert.equal(original.schemaVersion, 1);
  assert.equal(d.schemaVersion, 2);
  d = validateDocument({
    ...d,
    elements: d.elements.map((e) =>
      e.id === "two"
        ? {
            ...e,
            binding: { campaignId: "campaign", fieldId: "price" },
            localOverride: true,
            text: "",
          }
        : e,
    ),
  });
  const before = d;
  d = transformSelection(d, ["one"], {
    scale: 1.5,
    rotation: 90,
    origin: { x: 0, y: 0 },
  });
  assert.ok(Math.abs(d.elements[0].x + 45) < 1e-8);
  assert.ok(Math.abs(d.elements[0].y - 30) < 1e-8);
  assert.equal(d.elements[1].fontSize, 45);
  assert.equal(d.elements[1].rotation, 90);
  assert.deepEqual(d.elements[1].binding, before.elements[1].binding);
  assert.equal(d.elements[1].text, "");
  assert.equal(d.elements[1].localOverride, true);
  assert.deepEqual(d.elements[2], before.elements[2]);
  let h = commit(history(before), d);
  assert.deepEqual(undo(h).present, before);
  assert.deepEqual(redo(undo(h)).present, d);
  const ungroup = ungroupSelection(d, ["one"]);
  assert.equal(ungroup.elements[0].groupId, undefined);
  assert.deepEqual(
    ungroup.elements.map(({ groupId: _groupId, ...e }) => e),
    d.elements.map(({ groupId: _groupId, ...e }) => e),
  );
  assert.equal(before.elements[0].groupId, "group-a");
  assert.throws(() => transformSelection(d, ["one"], { scale: 1000 }));
});
test("locked and hidden groups cannot move, transform, align, delete or reorder accidentally", () => {
  let d = groupSelection(make(), ["one", "two"], "group-a");
  d = patchSelection(d, ["one"], { locked: true }, { includeProtected: true });
  assert.deepEqual(moveSelection(d, ["one"], 100, 0), d);
  assert.deepEqual(transformSelection(d, ["one"], { scale: 2 }), d);
  assert.deepEqual(deleteSelection(d, ["one"]), d);
  assert.deepEqual(alignSelection(d, ["one"], "left"), d);
  assert.deepEqual(reorderSelection(d, ["one"], 1), d);
  d = patchSelection(
    d,
    ["one"],
    { locked: false, hidden: true },
    { includeProtected: true },
  );
  assert.deepEqual(editableIds(d, ["one"]), []);
  assert.equal(d.elements[1].hidden, true);
  assert.deepEqual(moveSelection(d, ["one"], 20, 20), d);
});
test("align/distribute use rotated bounds and treat groups as units with stable relative geometry", () => {
  let d = make();
  let aligned = alignSelection(d, ids, "left");
  assert.ok(aligned.elements.every((e) => elementBounds(e).x === 20));
  aligned = alignSelection(d, ["one"], "canvas-center");
  assert.equal(aligned.elements[0].x, 490);
  let distributed = distributeSelection(d, ids, "x");
  const [a, b, c] = distributed.elements.map(elementBounds);
  assert.equal(b.x - a.x - a.width, c.x - b.x - b.width);
  d = groupSelection(d, ["one", "two"], "g");
  const before = d.elements[1].x - d.elements[0].x;
  aligned = alignSelection(d, ["one"], "canvas-center");
  assert.equal(aligned.elements[1].x - aligned.elements[0].x, before);
  assert.equal(
    bounds(aligned.elements.slice(0, 2)).x +
      bounds(aligned.elements.slice(0, 2)).width / 2,
    540,
  );
  assert.throws(() => distributeSelection(d, ids, "x"), /three/);
  assert.throws(() => alignSelection(d, ids, "bad"));
  const rotated = elementBounds({ ...d.elements[0], x: 0, y: 0, rotation: 90 });
  assert.ok(Math.abs(rotated.width - 60) < 1e-7);
});
test("snapping uses constant screen tolerance, canvas edges/center, object edges and supports disabling", () => {
  const d = make();
  assert.equal(snapSelection(d, ["one"], 9, 0, 1).dx, 9);
  assert.equal(snapSelection(d, ["one"], -16, 0, 1).dx, -20);
  assert.equal(snapSelection(d, ["one"], -10, 0, 0.5).dx, -20);
  assert.equal(snapSelection(d, ["one"], -10, 0, 2).dx, -10);
  assert.equal(snapSelection(d, ["one"], -16, 0, 1, false).dx, -16);
  const c = snapSelection(d, ["one"], 466, 0, 1);
  assert.equal(c.dx, 470);
  assert.ok(c.guides.some((g) => g.position === 540));
  assert.equal(snapSelection(d, ["one"], 128, 0, 1).dx, 130);
});
test("local clipboard preserves group membership, assets, overrides and stable bindings while remapping IDs", async () => {
  let d = groupSelection(make(), ["one", "two"], "group-a");
  d = validateDocument({
    ...d,
    elements: d.elements.map((e) =>
      e.id === "two"
        ? {
            ...e,
            binding: { campaignId: "campaign", fieldId: "price" },
            localOverride: true,
            text: "",
          }
        : e,
    ),
  });
  const payload = clipboardPayload(d, ["one"]);
  await writeClipboard(payload);
  assert.deepEqual(await readClipboard(), payload);
  const pasted = pasteSelection(newDesign("Destination"), payload, uid, {
    campaignIds: ["campaign"],
  });
  assert.equal(pasted.ids.length, 2);
  assert.notEqual(pasted.document.elements[0].groupId, "group-a");
  assert.equal(
    pasted.document.elements[0].groupId,
    pasted.document.elements[1].groupId,
  );
  assert.equal(pasted.document.elements[1].text, "");
  assert.equal(pasted.document.elements[1].binding.campaignId, "campaign");
  assert.equal(pasted.document.elements[0].x, 44);
  assert.throws(() => pasteSelection(newDesign(), payload, uid), /unavailable/);
  assert.throws(() => parseClipboard("<script>bad</script>"));
  assert.throws(() =>
    parseClipboard({ kind: "comvexa-selection", version: 99 }),
  );
  assert.throws(() =>
    parseClipboard({
      ...payload,
      document: { ...d, elements: [{ ...d.elements[0], type: "script" }] },
    }),
  );
});
test("grouped and hidden documents save/reopen without rewriting unrelated v1 records, and connected updates preserve metadata", async () => {
  let d = groupSelection(make(), ["one", "two"], "saved-group");
  d = patchSelection(
    d,
    ["three"],
    { hidden: true },
    { includeProtected: true },
  );
  const id = "stage-b-grouped";
  await designStore.save(id, d, 0);
  assert.deepEqual((await designStore.load(id)).document, d);
  const v1 = make();
  await designStore.save("stage-b-legacy", v1, 0);
  assert.deepEqual((await designStore.load("stage-b-legacy")).document, v1);
  const connected = validateDocument({
    ...d,
    elements: d.elements.map((e) =>
      e.id === "two"
        ? {
            ...e,
            binding: { campaignId: "campaign", fieldId: "price" },
            localOverride: false,
            text: "₱950",
          }
        : e,
    ),
  });
  const resolved = resolveDocument(connected, [
    {
      id: "campaign",
      sharedFields: [
        { id: "price", label: "Price", type: "text", value: "₱850" },
      ],
      assets: {},
    },
  ]).document;
  assert.equal(resolved.elements[1].text, "₱850");
  assert.equal(resolved.elements[1].groupId, "saved-group");
  assert.equal(resolved.elements[2].hidden, true);
  assert.deepEqual(
    { ...resolved.elements[1], text: "₱950" },
    {
      ...connected.elements[1],
      binding: { ...connected.elements[1].binding, transform: "plain" },
    },
  );
  assert.throws(
    () => validateDocument({ ...d, schemaVersion: 1 }),
    /group|visibility/,
  );
  assert.throws(() =>
    validateDocument({
      ...d,
      elements: [{ ...d.elements[0], groupId: "<script>" }],
    }),
  );
});
test("shortcuts respect editable text, composition, alt combinations, familiar modifiers and touch-equivalent commands", () => {
  const event = (key, extra = {}) => ({
    key,
    target: { tagName: "DIV" },
    ...extra,
  });
  for (const [key, action] of Object.entries({
    a: "all",
    c: "copy",
    x: "cut",
    v: "paste",
    d: "duplicate",
    g: "group",
    z: "undo",
    s: "save",
  }))
    assert.equal(shortcutAction(event(key, { ctrlKey: true })), action);
  assert.equal(
    shortcutAction(event("g", { metaKey: true, shiftKey: true })),
    "ungroup",
  );
  assert.deepEqual(shortcutAction(event("ArrowRight", { shiftKey: true })), {
    move: "arrowright",
    distance: 10,
  });
  assert.equal(shortcutAction(event("Escape")), "clear");
  for (const tagName of ["INPUT", "TEXTAREA", "SELECT"])
    assert.equal(
      shortcutAction(event("a", { metaKey: true, target: { tagName } })),
      null,
    );
  assert.equal(
    shortcutAction(event("g", { ctrlKey: true, isComposing: true })),
    null,
  );
  assert.equal(
    shortcutAction(event("g", { ctrlKey: true, altKey: true })),
    null,
  );
});
test("first saved v1→v2 edit atomically retains an original portable recovery snapshot across later saves", async () => {
  const id = "upgrade-with-backup",
    v1 = make();
  await designStore.save(id, v1, 0);
  const grouped = groupSelection(v1, ["one", "two"], "upgrade-group");
  await designStore.save(id, grouped, 1);
  let record = await designStore.load(id);
  assert.deepEqual(record.legacyV1Backup.document, v1);
  await designStore.save(id, moveSelection(grouped, ["one"], 20, 10), 2);
  record = await designStore.load(id);
  assert.deepEqual(record.legacyV1Backup.document, v1);
  assert.equal(record.document.schemaVersion, 2);
});
test("clipboard remaps cropped image references and rejects mixed-campaign insertion without altering source", async () => {
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile(
    new URL("../public/images/previews/motorcycle.webp", import.meta.url),
  );
  let d = validateDocument({
    ...newDesign("Photo copy"),
    assets: {
      photo: {
        src: `data:image/webp;base64,${bytes.toString("base64")}`,
        width: 960,
        height: 960,
      },
    },
    elements: [
      {
        ...makeElement("image", "image-1"),
        assetId: "photo",
        crop: { x: 0.1, y: 0.2, width: 0.5, height: 0.6 },
        binding: { campaignId: "source-campaign", fieldId: "photo" },
        localOverride: true,
      },
    ],
  });
  const payload = clipboardPayload(d, ["image-1"]),
    copy = pasteSelection(newDesign(), payload, uid, {
      campaignIds: ["source-campaign"],
    });
  const e = copy.document.elements[0];
  assert.notEqual(e.assetId, "photo");
  assert.deepEqual(copy.document.assets[e.assetId], d.assets.photo);
  assert.deepEqual(e.crop, d.elements[0].crop);
  assert.equal(e.localOverride, true);
  const other = validateDocument({
    ...make(),
    elements: make().elements.map((e) =>
      e.id === "two"
        ? { ...e, binding: { campaignId: "other", fieldId: "price" } }
        : e,
    ),
  });
  assert.throws(
    () =>
      pasteSelection(other, payload, uid, { campaignIds: ["source-campaign"] }),
    /another campaign/,
  );
  assert.equal(d.elements[0].assetId, "photo");
  const portable = await designStore.portable(
    groupSelection(make(), ["one", "two"], "portable-group"),
  );
  const imported = await designStore.importConnected(
    "stage-b-portable",
    portable,
    0,
    uid,
  );
  assert.equal(imported.document.schemaVersion, 2);
  assert.equal(imported.document.elements[0].groupId, "portable-group");
});
