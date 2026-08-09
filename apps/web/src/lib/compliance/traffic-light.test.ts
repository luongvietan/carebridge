import { describe, it, expect } from "vitest";
import { complianceLight, expiryBucket } from "./traffic-light";

const today = "2026-08-09";

const compliant = {
  professionalStatus: "active",
  hasOutstandingCriticalDocument: false,
  registrationLapsed: false,
  today,
};

describe("complianceLight", () => {
  it("is green for an active professional with nothing expiring", () => {
    expect(complianceLight({ ...compliant, soonestExpiry: "2027-01-01" })).toBe("green");
  });

  it("is green when there is nothing to expire at all", () => {
    expect(complianceLight(compliant)).toBe("green");
  });

  it("is amber when a document expires inside the reminder window", () => {
    expect(complianceLight({ ...compliant, soonestExpiry: "2026-09-01" })).toBe("amber");
  });

  it("is amber when the register check falls due soon", () => {
    expect(complianceLight({ ...compliant, verificationDueDate: "2026-08-20" })).toBe("amber");
  });

  it("is red when a critical document is outstanding", () => {
    expect(complianceLight({ ...compliant, hasOutstandingCriticalDocument: true })).toBe("red");
  });

  it("is red when the register check has lapsed", () => {
    expect(complianceLight({ ...compliant, registrationLapsed: true })).toBe("red");
  });

  it("is red for a professional the sweep has restricted", () => {
    expect(complianceLight({ ...compliant, professionalStatus: "booking_restricted" })).toBe("red");
  });

  it("is red for a suspended or removed professional", () => {
    expect(complianceLight({ ...compliant, professionalStatus: "temporarily_suspended" })).toBe("red");
    expect(complianceLight({ ...compliant, professionalStatus: "removed" })).toBe("red");
  });

  it("shows an applicant as pending rather than red", () => {
    expect(
      complianceLight({
        ...compliant,
        professionalStatus: "pending_verification",
        hasOutstandingCriticalDocument: true,
      }),
    ).toBe("pending");
  });

  it("treats an expiry already in the past as red, not amber", () => {
    // A lapsed document also raises hasOutstandingCriticalDocument, but the date
    // alone must never read as "expiring soon".
    expect(complianceLight({ ...compliant, soonestExpiry: "2026-08-01" })).toBe("green");
    expect(
      complianceLight({
        ...compliant,
        soonestExpiry: "2026-08-01",
        hasOutstandingCriticalDocument: true,
      }),
    ).toBe("red");
  });
});

describe("expiryBucket", () => {
  it("buckets by days remaining", () => {
    expect(expiryBucket("2026-08-08", today)).toBe("expired");
    expect(expiryBucket("2026-08-09", today)).toBe("30");
    expect(expiryBucket("2026-09-08", today)).toBe("30");
    expect(expiryBucket("2026-09-09", today)).toBe("60");
    expect(expiryBucket("2026-10-08", today)).toBe("60");
    expect(expiryBucket("2026-11-07", today)).toBe("90");
    expect(expiryBucket("2027-01-01", today)).toBe("later");
  });
});
