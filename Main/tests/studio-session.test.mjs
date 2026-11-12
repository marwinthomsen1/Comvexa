import test from "node:test";
import assert from "node:assert/strict";
import { leaveStudio } from "../src/features/editor/studio-session.js";
import {
  newDesign,
  makeElement,
  addElement,
  patchElement,
} from "../src/lib/editor/document.js";

test("opening shared information waits for pending canvas changes and retains bindings/empty overrides", async () => {
  let doc = addElement(
    newDesign("Studio regression"),
    makeElement("text", "linked-text"),
  );
  doc = patchElement(doc, "linked-text", {
    binding: { campaignId: "campaign", fieldId: "price" },
    localOverride: true,
    text: "",
  });
  const original = structuredClone(doc),
    events = [];
  let finish;
  const saving = new Promise((resolve) => {
    finish = resolve;
  });
  const result = leaveStudio({
    document: doc,
    savedDocument: "",
    save: async (value) => {
      events.push("save");
      assert.deepEqual(value, original);
      return saving;
    },
    navigate: () => events.push("navigate"),
  });
  assert.deepEqual(events, ["save"]);
  finish(true);
  assert.equal(await result, true);
  assert.deepEqual(events, ["save", "navigate"]);
  assert.deepEqual(doc, original);
});
test("failed save keeps the editor open; unchanged artwork can navigate without rewriting its revision", async () => {
  const doc = newDesign("Kept work");
  let navigated = false;
  assert.equal(
    await leaveStudio({
      document: doc,
      savedDocument: "",
      save: async () => false,
      navigate: () => {
        navigated = true;
      },
    }),
    false,
  );
  assert.equal(navigated, false);
  assert.equal(
    await leaveStudio({
      document: doc,
      savedDocument: JSON.stringify(doc),
      save: async () => {
        throw new Error("must not resave");
      },
      navigate: () => {
        navigated = true;
      },
    }),
    true,
  );
  assert.equal(navigated, true);
});
