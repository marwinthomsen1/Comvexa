import test from "node:test";
import assert from "node:assert/strict";
import {
  createFrameChannel,
  selectionFrame,
  snapRotation,
  rotationPolicy,
  ROTATION_STOPS,
  formatAngle,
  finalTransformPatches,
  transformAppearance,
} from "../src/lib/editor/transform-session.js";
import {
  createSnapSession,
  snapSelection,
  groupSelection,
  transformSelection,
} from "../src/lib/editor/selection.js";
import {
  newDesign,
  makeElement,
  validateDocument,
  history,
  commit,
  undo,
  redo,
} from "../src/lib/editor/document.js";
function clock() {
  let id = 0;
  const pending = new Map();
  return {
    request: (cb) => {
      pending.set(++id, cb);
      return id;
    },
    cancel: (id) => pending.delete(id),
    step: () => {
      const all = [...pending.values()];
      pending.clear();
      all.forEach((cb) => cb());
    },
    get size() {
      return pending.size;
    },
  };
}
test("pointer samples coalesce into one paint; end flushes latest sample exactly once; cancel and teardown discard work", () => {
  const c = clock(),
    draws = [],
    channel = createFrameChannel((v) => draws.push(v), c.request, c.cancel);
  for (let i = 0; i < 1000; i++) channel.push({ x: i });
  assert.equal(c.size, 1);
  assert.equal(draws.length, 0);
  c.step();
  assert.deepEqual(draws, [{ x: 999 }]);
  channel.push({ x: 1000 });
  channel.push({ x: 1001 });
  channel.flush();
  assert.equal(c.size, 0);
  assert.deepEqual(draws.at(-1), { x: 1001 });
  c.step();
  assert.equal(draws.length, 2);
  channel.flush();
  assert.equal(draws.length, 2);
  channel.push({ x: 1002 });
  channel.cancel();
  c.step();
  assert.equal(draws.length, 2);
});
test("rotation snaps at 15 degree stops with a small capture zone, wrap-safe zero and Shift inversion", () => {
  assert.equal(ROTATION_STOPS.length, 24);
  for (const angle of [0, 15, 30, 45, 90, 180, 270, 345]) {
    assert.equal(snapRotation(angle + 2), angle);
    assert.equal(snapRotation(angle - 2), angle);
  }
  assert.equal(snapRotation(22), 22);
  assert.equal(snapRotation(359), 0);
  assert.equal(snapRotation(-1), 0);
  assert.equal(snapRotation(31, true, true), 31);
  assert.equal(snapRotation(31, false, true), 30);
  assert.equal(snapRotation(31, false, false), 31);
  assert.equal(rotationPolicy(true, true).stops.length, 0);
  assert.equal(formatAngle(359), "-1°");
  assert.equal(formatAngle(360), "0°");
});
test("oriented group frame remains stable through move, uniform scale, save/reopen-style reattachment and undo/redo across zero", () => {
  let frame = selectionFrame(
    null,
    [{ rotation: 350 }, { rotation: 350 }],
    "group",
  );
  assert.equal(frame.rotation, 350);
  frame = selectionFrame(frame, [{ rotation: 10 }, { rotation: 10 }], "group");
  assert.equal(frame.rotation, 370);
  const moved = selectionFrame(
    frame,
    [{ rotation: 10 }, { rotation: 10 }],
    "group",
  );
  assert.equal(moved.rotation, 370);
  const undone = selectionFrame(
    moved,
    [{ rotation: 350 }, { rotation: 350 }],
    "group",
  );
  assert.equal(undone.rotation, 350);
  const fresh = selectionFrame(
    undone,
    [{ rotation: 45 }, { rotation: 45 }],
    "new",
  );
  assert.equal(fresh.rotation, 45);
  assert.equal(
    selectionFrame(null, [{ rotation: 10 }, { rotation: 25 }], "mixed")
      .rotation,
    0,
  );
});
test("final transform is a single immutable history commit; glyph scale, layout and campaign/image fields survive", () => {
  const text = {
    ...makeElement("text", "text"),
    fontSize: 30,
    text: "",
    binding: { campaignId: "campaign", fieldId: "price" },
    localOverride: true,
  };
  const shape = { ...makeElement("rect", "shape"), x: 500, strokeWidth: 2 };
  let d = validateDocument({ ...newDesign(), elements: [text, shape] });
  d = groupSelection(d, ["text", "shape"], "group");
  const samples = d.elements.map((e) => ({
    id: e.id,
    x: e.x + 10,
    y: e.y + 20,
    rotation: 30,
    scaleX: 1.5,
    scaleY: 1.5,
  }));
  const changes = finalTransformPatches(d.elements, samples),
    next = validateDocument({
      ...d,
      elements: d.elements.map((e) => ({
        ...e,
        ...changes.find((p) => p.id === e.id).patch,
      })),
    });
  assert.equal(next.elements[0].fontSize, 45);
  assert.equal(next.elements[1].strokeWidth, 3);
  assert.equal(next.elements[0].text, "");
  assert.deepEqual(next.elements[0].binding, d.elements[0].binding);
  assert.equal(next.elements[0].groupId, "group");
  assert.equal(next.elements[0].localOverride, true);
  const h = commit(history(d), next);
  assert.equal(h.past.length, 1);
  assert.deepEqual(undo(h).present, d);
  assert.deepEqual(redo(undo(h)).present, next);
  assert.deepEqual(
    finalTransformPatches(
      d.elements,
      d.elements.map((e) => ({
        id: e.id,
        x: e.x,
        y: e.y,
        rotation: e.rotation + 360,
        scaleX: 1,
        scaleY: 1,
      })),
    ),
    [],
  );
  const single = finalTransformPatches(
    [text],
    [{ id: "text", x: 80, y: 80, rotation: 0, scaleX: 2, scaleY: 2 }],
  );
  assert.equal(single[0].patch.fontSize, 60);
});
test("cached drag snapping matches the existing contract and never reads documents per frame", () => {
  const data = validateDocument({
    ...newDesign(),
    elements: [
      makeElement("rect", "one"),
      { ...makeElement("rect", "two"), x: 650 },
    ],
  });
  let reads = 0;
  const doc = {
    ...data,
    get elements() {
      reads++;
      return data.elements;
    },
  };
  const snap = createSnapSession(doc, ["one"], 0.5, true),
    prepared = reads;
  for (let i = 0; i < 1000; i++) snap(i / 10, 20);
  assert.equal(reads, prepared);
  for (const dx of [-78, 7, 99, 600])
    assert.deepEqual(
      snap(dx, 10),
      snapSelection(data, ["one"], dx, 10, 0.5, true),
    );
});
test("selection chrome uses one thin border, compact handles and larger invisible touch targets", () => {
  const mouse = transformAppearance(false),
    touch = transformAppearance(true);
  assert.ok(mouse.border < 1.5);
  assert.ok(mouse.anchor <= 8);
  assert.ok(touch.hit >= 24);
  assert.ok(touch.rotation >= 30);
  assert.ok(touch.offset > mouse.offset);
  assert.ok(touch.hit > touch.anchor);
});
test("group numeric rotation and pointer bake use equivalent world geometry", () => {
  let d = validateDocument({
    ...newDesign(),
    elements: [
      makeElement("rect", "one"),
      { ...makeElement("text", "two"), x: 550, fontSize: 20 },
    ],
  });
  d = groupSelection(d, ["one", "two"], "group");
  const expected = transformSelection(d, ["one"], {
    scale: 1.2,
    rotation: 30,
    origin: { x: 0, y: 0 },
  });
  const patches = finalTransformPatches(
    d.elements,
    expected.elements.map((e) => ({
      id: e.id,
      x: e.x,
      y: e.y,
      rotation: e.rotation,
      scaleX: 1.2,
      scaleY: 1.2,
    })),
  );
  for (const p of patches) {
    const e = expected.elements.find((e) => e.id === p.id);
    for (const [k, v] of Object.entries(p.patch))
      assert.ok(Math.abs(e[k] - v) < 1e-5, k);
  }
});
