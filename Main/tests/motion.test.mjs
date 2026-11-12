import test from "node:test";
import assert from "node:assert/strict";
import { installScrollMotion } from "../src/lib/motion/scroll-motion.js";
function node() {
  const classes = new Set();
  return {
    classes,
    dataset: {},
    classList: {
      add: (value) => classes.add(value),
      remove: (value) => classes.delete(value),
    },
  };
}
function setup(reduced = false) {
  const root = node(),
    section = node(),
    stage = node(),
    observers = [],
    listeners = new Set();
  const preference = {
    matches: reduced,
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn),
  };
  class Observer {
    constructor(callback) {
      this.callback = callback;
      this.nodes = new Set();
      observers.push(this);
    }
    observe(target) {
      this.nodes.add(target);
    }
    unobserve(target) {
      this.nodes.delete(target);
    }
    disconnect() {
      this.disconnected = true;
      this.nodes.clear();
    }
  }
  const query = (selector) => (selector === ".reveal" ? [section] : [stage]);
  return {
    root,
    section,
    stage,
    observers,
    listeners,
    preference,
    Observer,
    query,
  };
}
test("scroll motion reveals once, pauses offscreen decoration, and cleans up on navigation", () => {
  const env = setup();
  const cleanup = installScrollMotion(env);
  assert.equal(env.root.classes.has("motion-ready"), true);
  env.observers[0].callback([{ target: env.section, isIntersecting: true }]);
  assert.equal(env.section.classes.has("is-visible"), true);
  assert.equal(env.observers[0].nodes.size, 0);
  env.observers[1].callback([{ target: env.stage, isIntersecting: false }]);
  assert.equal(env.stage.dataset.visible, "false");
  cleanup();
  assert.equal(env.root.classes.has("motion-ready"), false);
  assert.ok(env.observers.every((item) => item.disconnected));
  assert.equal(env.listeners.size, 0);
});
test("reduced motion and unsupported observers keep all sections visible", () => {
  const env = setup(true);
  const cleanup = installScrollMotion(env);
  assert.equal(env.root.classes.has("motion-ready"), false);
  assert.equal(env.observers.length, 0);
  env.preference.matches = false;
  for (const listener of env.listeners) listener();
  assert.equal(env.root.classes.has("motion-ready"), true);
  env.preference.matches = true;
  for (const listener of env.listeners) listener();
  assert.equal(env.root.classes.has("motion-ready"), false);
  cleanup();
  const fallback = setup();
  const stop = installScrollMotion({ ...fallback, Observer: undefined });
  assert.equal(fallback.root.classes.has("motion-ready"), false);
  stop();
});
