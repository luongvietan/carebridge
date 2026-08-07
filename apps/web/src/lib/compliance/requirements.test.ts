import { describe, it, expect } from "vitest";
import { eligibilityOutcome, isCompliant, canActivateProfessional } from "./requirements";

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

describe("canActivateProfessional", () => {
  const passed = { assessmentPassed: true };

  it("does not activate when documents are not compliant", () => {
    expect(
      canActivateProfessional({
        ...passed,
        documentsCompliant: false,
        trainingAttestedCurrent: true,
        hasApprovedTrainingCertificate: true,
      }),
    ).toBe(false);
  });

  it("does not activate when the competency assessment has not been passed", () => {
    expect(
      canActivateProfessional({
        assessmentPassed: false,
        documentsCompliant: true,
        trainingAttestedCurrent: true,
        hasApprovedTrainingCertificate: true,
      }),
    ).toBe(false);
  });

  it("activates a compliant professional whose training was attested current", () => {
    expect(
      canActivateProfessional({
        ...passed,
        documentsCompliant: true,
        trainingAttestedCurrent: true,
        hasApprovedTrainingCertificate: false,
      }),
    ).toBe(true);
  });

  it("activates a compliant professional with no eligibility screening on record", () => {
    expect(
      canActivateProfessional({
        ...passed,
        documentsCompliant: true,
        trainingAttestedCurrent: null,
        hasApprovedTrainingCertificate: false,
      }),
    ).toBe(true);
  });

  it("holds a training-not-current professional until an updated training certificate is approved", () => {
    expect(
      canActivateProfessional({
        ...passed,
        documentsCompliant: true,
        trainingAttestedCurrent: false,
        hasApprovedTrainingCertificate: false,
      }),
    ).toBe(false);
  });

  it("activates a training-not-current professional once an approved training certificate is provided", () => {
    expect(
      canActivateProfessional({
        ...passed,
        documentsCompliant: true,
        trainingAttestedCurrent: false,
        hasApprovedTrainingCertificate: true,
      }),
    ).toBe(true);
  });
});

describe("canActivateProfessional — registration verification", () => {
  const base = {
    documentsCompliant: true,
    assessmentPassed: true,
    trainingAttestedCurrent: true,
    hasApprovedTrainingCertificate: true,
  };

  it("blocks a regulated professional whose registration is unverified", () => {
    expect(canActivateProfessional({ ...base, registrationVerified: false })).toBe(false);
  });

  it("activates once the register check is recorded", () => {
    expect(canActivateProfessional({ ...base, registrationVerified: true })).toBe(true);
  });

  it("leaves unregulated roles unaffected when the flag is absent", () => {
    expect(canActivateProfessional(base)).toBe(true);
  });

  it("still requires documents and the assessment even when verified", () => {
    expect(
      canActivateProfessional({ ...base, documentsCompliant: false, registrationVerified: true }),
    ).toBe(false);
    expect(
      canActivateProfessional({ ...base, assessmentPassed: false, registrationVerified: true }),
    ).toBe(false);
  });
});
