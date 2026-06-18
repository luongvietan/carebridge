import { describe, it, expect } from "vitest";
import { profileSchema, isPlausibleDateOfBirth } from "./onboarding";

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

describe("profileSchema professional registration details", () => {
  it("captures the registration body and number", () => {
    const r = profileSchema.safeParse({
      ...base,
      registrationBody: "NMC",
      registrationNumber: "12A3456E",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.registrationBody).toBe("NMC");
      expect(r.data.registrationNumber).toBe("12A3456E");
    }
  });
});

describe("isPlausibleDateOfBirth", () => {
  const today = "2026-06-18";

  it("accepts an empty/undefined value (optional field)", () => {
    expect(isPlausibleDateOfBirth(undefined, today)).toBe(true);
    expect(isPlausibleDateOfBirth("", today)).toBe(true);
  });
  it("rejects a future date of birth", () => {
    expect(isPlausibleDateOfBirth("2999-01-01", today)).toBe(false);
  });
  it("rejects today (age 0)", () => {
    expect(isPlausibleDateOfBirth("2026-06-18", today)).toBe(false);
  });
  it("rejects an under-16 date of birth", () => {
    expect(isPlausibleDateOfBirth("2012-06-18", today)).toBe(false);
  });
  it("accepts a plausible adult date of birth", () => {
    expect(isPlausibleDateOfBirth("1990-05-20", today)).toBe(true);
  });
  it("rejects an implausibly old date of birth", () => {
    expect(isPlausibleDateOfBirth("1900-01-01", today)).toBe(false);
  });
  it("rejects a malformed date", () => {
    expect(isPlausibleDateOfBirth("not-a-date", today)).toBe(false);
    expect(isPlausibleDateOfBirth("2026-13-40", today)).toBe(false);
  });
});

describe("profileSchema date of birth validation", () => {
  it("rejects a future date of birth", () => {
    expect(profileSchema.safeParse({ ...base, dateOfBirth: "2999-01-01" }).success).toBe(false);
  });
  it("accepts a valid adult date of birth", () => {
    expect(profileSchema.safeParse({ ...base, dateOfBirth: "1990-05-20" }).success).toBe(true);
  });
});
