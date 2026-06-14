import { describe, it, expect } from "vitest";
import { scorePercent, isPass, nextAttemptState } from "./scoring";

describe("scorePercent", () => {
  it("computes percent correct", () => {
    expect(scorePercent([true, true, false, true])).toBe(75);
    expect(scorePercent([true, true, true, true, true])).toBe(100);
  });
  it("returns 0 for no answers", () => expect(scorePercent([])).toBe(0));
});

describe("isPass", () => {
  it("passes at the 80% threshold, fails just below", () => {
    expect(isPass(80)).toBe(true);
    expect(isPass(79.9)).toBe(false);
  });
});

describe("nextAttemptState", () => {
  const now = new Date("2026-06-15T00:00:00Z");
  it("ends the process on a pass", () => {
    expect(nextAttemptState(1, true, now)).toEqual({ canRetry: false, lockUntil: null });
  });
  it("allows retry after a fail before the 3rd attempt", () => {
    expect(nextAttemptState(2, false, now).canRetry).toBe(true);
  });
  it("locks for 3 months after the 3rd failed attempt", () => {
    const s = nextAttemptState(3, false, now);
    expect(s.canRetry).toBe(false);
    expect(s.lockUntil?.toISOString().slice(0, 10)).toBe("2026-09-15");
  });
});
