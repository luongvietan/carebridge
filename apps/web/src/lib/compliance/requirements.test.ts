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
  it("does not activate when documents are not compliant", () => {
    expect(
      canActivateProfessional({
        documentsCompliant: false,
        trainingAttestedCurrent: true,
        hasApprovedTrainingCertificate: true,
      }),
    ).toBe(false);
  });

  it("activates a compliant professional whose training was attested current", () => {
    expect(
      canActivateProfessional({
        documentsCompliant: true,
        trainingAttestedCurrent: true,
        hasApprovedTrainingCertificate: false,
      }),
    ).toBe(true);
  });

  it("activates a compliant professional with no eligibility screening on record", () => {
    expect(
      canActivateProfessional({
        documentsCompliant: true,
        trainingAttestedCurrent: null,
        hasApprovedTrainingCertificate: false,
      }),
    ).toBe(true);
  });

  it("holds a training-not-current professional until an updated training certificate is approved", () => {
    expect(
      canActivateProfessional({
        documentsCompliant: true,
        trainingAttestedCurrent: false,
        hasApprovedTrainingCertificate: false,
      }),
    ).toBe(false);
  });

  it("activates a training-not-current professional once an approved training certificate is provided", () => {
    expect(
      canActivateProfessional({
        documentsCompliant: true,
        trainingAttestedCurrent: false,
        hasApprovedTrainingCertificate: true,
      }),
    ).toBe(true);
  });
});
