import test from "node:test";
import assert from "node:assert/strict";
import {
  formatDemoPrice,
  validateDemoPrice,
} from "../src/lib/design-document/demo-price.js";
test("connected demo formats the requested 950 to 850 change without touching saved records", () => {
  assert.equal(formatDemoPrice("950"), "₱950");
  assert.equal(formatDemoPrice("850"), "₱850");
  assert.equal(formatDemoPrice("0"), "₱0");
  assert.equal(formatDemoPrice("999999"), "₱999,999");
  assert.equal(formatDemoPrice(""), "—");
});
test("demo prices reject oversized, negative, fractional, scientific and nonnumeric input", () => {
  for (const value of [
    "1000000",
    "-1",
    "850.1",
    "1e3",
    "Infinity",
    "NaN",
    "850<script>",
    null,
    850,
  ]) {
    assert.equal(validateDemoPrice(value), false);
    assert.throws(() => formatDemoPrice(value));
  }
});
