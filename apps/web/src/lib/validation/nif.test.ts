import { describe, it, expect } from "vitest";
import { isValidNif } from "./nif";

describe("isValidNif", () => {
  it("accepts valid NIFs across holder types", () => {
    expect(isValidNif("501964843")).toBe(true); // company (5…)
    expect(isValidNif("245076441")).toBe(true); // individual (2…)
    expect(isValidNif("999999990")).toBe(true); // remainder under 2 → check digit 0
  });

  it("accepts spaces between the digits", () => {
    expect(isValidNif("501 964 843")).toBe(true);
  });

  it("rejects a wrong check digit", () => {
    expect(isValidNif("501964844")).toBe(false);
  });

  it("rejects impossible first digits", () => {
    expect(isValidNif("012345678")).toBe(false);
    expect(isValidNif("312345678")).toBe(false);
    expect(isValidNif("412345678")).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(isValidNif("")).toBe(false);
    expect(isValidNif(null)).toBe(false);
    expect(isValidNif(undefined)).toBe(false);
    expect(isValidNif("12345678")).toBe(false); // too short
    expect(isValidNif("1234567890")).toBe(false); // too long
    expect(isValidNif("5019C4843")).toBe(false);
  });
});
