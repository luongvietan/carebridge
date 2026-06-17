import { describe, it, expect } from "vitest";
import { parseSkillIds, parseAvailabilityDays, DAYS_OF_WEEK } from "./profile-children";

describe("parseSkillIds", () => {
  const a = "11111111-1111-4111-8111-111111111111";
  const b = "22222222-2222-4222-8222-222222222222";

  it("keeps valid uuids and de-duplicates", () => {
    expect(parseSkillIds([a, b, a])).toEqual([a, b]);
  });
  it("drops non-uuid and blank values", () => {
    expect(parseSkillIds([a, "not-a-uuid", ""])).toEqual([a]);
  });
  it("returns empty for no input", () => {
    expect(parseSkillIds([])).toEqual([]);
  });
});

describe("parseAvailabilityDays", () => {
  it("keeps valid day numbers 0-6, de-duplicates and sorts", () => {
    expect(parseAvailabilityDays(["6", "0", "3", "3"])).toEqual([0, 3, 6]);
  });
  it("drops out-of-range and non-integer values", () => {
    expect(parseAvailabilityDays(["7", "-1", "x", "2.5", "2"])).toEqual([2]);
  });
  it("returns empty for no input", () => {
    expect(parseAvailabilityDays([])).toEqual([]);
  });
});

describe("DAYS_OF_WEEK", () => {
  it("maps the seven weekdays to indices 0-6", () => {
    expect(DAYS_OF_WEEK.map((d) => d.value)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(DAYS_OF_WEEK[0].label).toBe("Monday");
    expect(DAYS_OF_WEEK[6].label).toBe("Sunday");
  });
});
