import test from "node:test";
import assert from "node:assert/strict";
import { blankFeatures, makeFloodPayload, readFloodJson, isMissing } from "./floodForm.mjs";

test("zero survives serialization while blank fields become explicit null", () => {
  const p = makeFloodPayload({ ...blankFeatures(), X: "0" }, " point-0 ");
  assert.equal(p.features.X, 0);
  assert.equal(p.features.Y, null);
  assert.equal(Object.keys(p.features).length, 9);
  assert.equal(p.point_id, "point-0");
});
test("NoData-only, empty and nonfinite input cannot produce a misleading result", () => {
  assert.throws(() => makeFloodPayload(blankFeatures()));
  assert.throws(() => makeFloodPayload({ ...blankFeatures(), X: -9999 }));
  assert.throws(() => makeFloodPayload({ ...blankFeatures(), X: -1e31 }));
  for (const X of [Infinity, "1e400", "NaN", 3.5e38]) assert.throws(() => makeFloodPayload({ ...blankFeatures(), X }));
  assert.equal(isMissing(-9999), true);
  assert.equal(isMissing(0), false);
});
test("JSON import enforces the same feature contract as BE and AI", () => {
  const good = makeFloodPayload({ ...blankFeatures(), X: 0 });
  assert.deepEqual(readFloodJson(JSON.stringify(good)), good);
  for (const bad of [{ ...good, extra: 1 }, { features: { X: 1 } }, { ...good, point_id: 5 }, { ...good, features: { ...good.features, X: "0" } }])
    assert.throws(() => readFloodJson(JSON.stringify(bad)));
  assert.throws(() => readFloodJson("{"));
  assert.throws(() => makeFloodPayload({ ...blankFeatures(), X: 1 }, "x".repeat(129)));
});
