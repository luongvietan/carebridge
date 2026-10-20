import { test as it } from "node:test";
import assert from "node:assert/strict";
import { databaseCoverageReady } from "./readiness-policy.mjs";

it("fails when market or active roles are missing", () => {
  assert.equal(databaseCoverageReady({ markets: [], common: 20, roles: [{ complete: true }] }), false);
  assert.equal(databaseCoverageReady({ markets: [{ code: "PT" }], common: 20, roles: [] }), false);
});
it("requires twenty common pilot questions; specialist banks are optional", () => {
  assert.equal(databaseCoverageReady({ markets: [{ code: "PT" }], common: 19, roles: [{ complete: true }] }), false);
  assert.equal(databaseCoverageReady({ markets: [{ code: "PT" }], common: 20, roles: [{ complete: false }] }), true);
});
it("accepts complete coverage while leaving approval as a separate decision", () => {
  assert.equal(databaseCoverageReady({ markets: [{ code: "PT", is_live: false }], common: 20, roles: [{ complete: true }] }), true);
});
