import { describe, it, expect } from "vitest";
import { londonWallClockToUtc } from "./datetime";

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
});
