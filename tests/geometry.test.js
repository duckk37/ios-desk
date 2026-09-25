import test from "node:test";
import assert from "node:assert/strict";
import { containedImageRect, mapPointerToDevice } from "../src/geometry.js";

test("containedImageRect letterboxes portrait image", () => {
  const rect = containedImageRect(500, 500, 390, 844);
  assert.equal(rect.height, 500);
  assert.ok(Math.abs(rect.width - 231.0427) < 0.01);
  assert.ok(Math.abs(rect.x - 134.4786) < 0.01);
  assert.equal(rect.y, 0);
});

test("mapPointerToDevice maps center and rejects letterbox", () => {
  const rect = containedImageRect(500, 500, 390, 844);
  assert.deepEqual(mapPointerToDevice(250, 250, rect, 390, 844), { x: 195, y: 422 });
  assert.equal(mapPointerToDevice(10, 250, rect, 390, 844), null);
});

test("dimensions must be positive", () => {
  assert.throws(() => containedImageRect(0, 10, 10, 10), RangeError);
});
