import { describe, it, expect } from "vitest";
import { profileSchema } from "./onboarding";

const base = {
  addressLine1: "1 Test Street",
  city: "London",
  postcode: "E1 6AN",
  professionalRoleId: "11111111-1111-4111-8111-111111111111",
};

describe("profileSchema National Insurance validation", () => {
  it("accepts a profile with no NI number (optional)", () => {
    expect(profileSchema.safeParse(base).success).toBe(true);
  });

  it("accepts a valid NI number", () => {
    expect(profileSchema.safeParse({ ...base, nationalInsuranceNo: "QQ123456C" }).success).toBe(true);
  });

  it("accepts a valid NI number with spaces", () => {
    expect(profileSchema.safeParse({ ...base, nationalInsuranceNo: "QQ 12 34 56 C" }).success).toBe(true);
  });

  it("rejects a malformed NI number", () => {
    expect(profileSchema.safeParse({ ...base, nationalInsuranceNo: "12345" }).success).toBe(false);
  });
});
