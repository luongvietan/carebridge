import { describe, it, expect } from "vitest";
import { buildCertificate } from "./certificate";

const base = {
  fullName: "Jane Smith",
  roleName: "Registered Nurse",
  attempt: {
    id: "a1b2c3d4-0000-0000-0000-000000000000",
    score: 90,
    passed: true,
    completed_at: "2026-06-18T10:30:00.000Z",
  },
};

describe("buildCertificate", () => {
  it("produces a certificate for a passed, completed attempt", () => {
    const cert = buildCertificate(base);
    expect(cert).not.toBeNull();
    expect(cert).toMatchObject({
      fullName: "Jane Smith",
      roleName: "Registered Nurse",
      score: 90,
      dateCompleted: "18 June 2026",
    });
  });

  it("derives a stable certificate number from the attempt id", () => {
    expect(buildCertificate(base)!.certificateNumber).toBe("CBC-A1B2C3D4");
  });

  it("returns null when the attempt was not passed", () => {
    expect(buildCertificate({ ...base, attempt: { ...base.attempt, passed: false } })).toBeNull();
  });

  it("returns null when the attempt has no completion date", () => {
    expect(buildCertificate({ ...base, attempt: { ...base.attempt, completed_at: null } })).toBeNull();
  });
});
