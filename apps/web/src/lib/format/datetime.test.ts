import { describe, it, expect } from "vitest";
import { londonWallClockToUtc, londonDateRangeToUtc, formatLondon } from "./datetime";

describe("formatLondon", () => {
  it("renders a UTC instant in Europe/London (BST = UTC+1)", () => {
    // 13:00 UTC in June is 14:00 London — independent of the runtime timezone.
    expect(formatLondon("2026-06-20T13:00:00.000Z")).toMatch(/14:00/);
  });
  it("renders a winter (GMT) instant unchanged", () => {
    expect(formatLondon("2026-01-20T09:00:00.000Z")).toMatch(/09:00/);
  });
  it("returns an empty string for nullish or malformed input", () => {
    expect(formatLondon(null)).toBe("");
    expect(formatLondon(undefined)).toBe("");
    expect(formatLondon("not-a-date")).toBe("");
  });
});

describe("londonWallClockToUtc", () => {
  it("treats a summer (BST, UTC+1) wall clock as London time", () => {
    // 09:00 London in June is 08:00 UTC.
    expect(londonWallClockToUtc("2026-06-20T09:00")?.toISOString()).toBe("2026-06-20T08:00:00.000Z");
  });
  it("treats a winter (GMT, UTC+0) wall clock as London time", () => {
    expect(londonWallClockToUtc("2026-01-20T09:00")?.toISOString()).toBe("2026-01-20T09:00:00.000Z");
  });
  it("does not depend on the runtime timezone for the result", () => {
    // Regardless of where this runs, midnight London on a winter date is 00:00 UTC.
    expect(londonWallClockToUtc("2026-02-01T00:00")?.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });
  it("returns null for malformed input", () => {
    expect(londonWallClockToUtc("")).toBeNull();
    expect(londonWallClockToUtc("2026-06-20")).toBeNull();
    expect(londonWallClockToUtc("nonsense")).toBeNull();
  });
  it("resolves a wall-clock just after the autumn fall-back to GMT", () => {
    // BST→GMT is 2026-10-25 02:00. 03:00 local that day is firmly GMT (UTC+0).
    expect(londonWallClockToUtc("2026-10-25T03:00")?.toISOString()).toBe("2026-10-25T03:00:00.000Z");
  });
});

describe("londonDateRangeToUtc", () => {
  it("includes the whole of the 'to' day with a half-open upper bound (BST)", () => {
    const { gte, lt } = londonDateRangeToUtc("2026-06-01", "2026-06-18");
    // Start of 1 June London (BST) is 2026-05-31T23:00Z; end is start of 19 June London.
    expect(gte).toBe("2026-05-31T23:00:00.000Z");
    expect(lt).toBe("2026-06-18T23:00:00.000Z");
  });
  it("uses UTC midnight bounds in winter (GMT)", () => {
    const { gte, lt } = londonDateRangeToUtc("2026-01-01", "2026-01-31");
    expect(gte).toBe("2026-01-01T00:00:00.000Z");
    expect(lt).toBe("2026-02-01T00:00:00.000Z");
  });
  it("handles month/year rollover on the 'to' bound", () => {
    // Day after 2026-12-31 is 2027-01-01; winter (GMT) start = 00:00Z.
    expect(londonDateRangeToUtc(undefined, "2026-12-31").lt).toBe("2027-01-01T00:00:00.000Z");
  });
  it("returns an empty object when no dates are given", () => {
    expect(londonDateRangeToUtc()).toEqual({});
  });
});
