import { test as it } from "node:test";
import assert from "node:assert/strict";
import { databaseCoverageReady } from "./readiness-policy.mjs";

it("fails when market or active roles are missing", () => {
  assert.equal(databaseCoverageReady({ markets: [], common: 20, roles: [{ complete: true }] }), false);
  assert.equal(databaseCoverageReady({ markets: [{ code: "PT" }], common: 20, roles: [] }), false);
});
it("fails without sufficient common or specialist coverage", () => {
  assert.equal(databaseCoverageReady({ markets: [{ code: "PT" }], common: 19, roles: [{ complete: true }] }), false);
  assert.equal(databaseCoverageReady({ markets: [{ code: "PT" }], common: 20, roles: [{ complete: false }] }), false);
});
it("accepts complete coverage while leaving approval as a separate decision", () => {
  assert.equal(databaseCoverageReady({ markets: [{ code: "PT", is_live: false }], common: 20, roles: [{ complete: true }] }), true);
});
