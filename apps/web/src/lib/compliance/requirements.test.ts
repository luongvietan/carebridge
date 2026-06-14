import { describe, it, expect } from "vitest";
import { eligibilityOutcome, isCompliant } from "./requirements";

describe("eligibilityOutcome", () => {
  it("continues when all mandatory training is current", () => {
    expect(eligibilityOutcome(true)).toBe("continue");
  });
  it("pends when training is not current", () => {
    expect(eligibilityOutcome(false)).toBe("pending");
  });
});

describe("isCompliant", () => {
  it("is true when all required critical docs are approved", () => {
    expect(isCompliant(["dbs", "rtw"], new Set(["dbs", "rtw", "extra"]))).toBe(true);
  });
  it("is false when a required critical doc is missing", () => {
    expect(isCompliant(["dbs", "rtw"], new Set(["dbs"]))).toBe(false);
  });
  it("is vacuously true with no required critical docs", () => {
    expect(isCompliant([], new Set())).toBe(true);
  });
});
