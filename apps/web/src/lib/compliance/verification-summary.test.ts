import { describe, it, expect } from "vitest";
import { summariseVerification } from "./verification-summary";

const NURSE_REQUIRED = [
  "photo_id",
  "right_to_work",
  "enhanced_dbs",
  "professional_registration",
  "mandatory_training_certificate",
  "professional_reference",
];

const ALL_APPROVED = [...NURSE_REQUIRED];

describe("summariseVerification", () => {
  it("passes every check for a fully compliant, register-checked nurse", () => {
    const summary = summariseVerification({
      register: "nmc" as const,
      approvedDocumentCodes: ALL_APPROVED,
      requiredDocumentCodes: NURSE_REQUIRED,
      registrationVerified: true,
    });
    expect(summary.fullyVerified).toBe(true);
    expect(summary.checks.map((c) => c.state)).not.toContain("outstanding");
  });

  it("withholds the badge when the register check is missing", () => {
    const summary = summariseVerification({
      register: "nmc" as const,
      approvedDocumentCodes: ALL_APPROVED,
      requiredDocumentCodes: NURSE_REQUIRED,
      registrationVerified: false,
    });
    expect(summary.fullyVerified).toBe(false);
    expect(summary.checks.find((c) => c.key === "registration")?.state).toBe("outstanding");
  });

  it("withholds the badge when a document has lapsed", () => {
    const summary = summariseVerification({
      register: "nmc" as const,
      approvedDocumentCodes: ALL_APPROVED.filter((c) => c !== "enhanced_dbs"),
      requiredDocumentCodes: NURSE_REQUIRED,
      registrationVerified: true,
    });
    expect(summary.fullyVerified).toBe(false);
    expect(summary.checks.find((c) => c.key === "criminal_record")?.state).toBe("outstanding");
  });

  it("marks registration not applicable for an unregulated role, and still awards the badge", () => {
    const required = NURSE_REQUIRED.filter((c) => c !== "professional_registration");
    const summary = summariseVerification({
      register: null,
      approvedDocumentCodes: required,
      requiredDocumentCodes: required,
      registrationVerified: false,
    });
    expect(summary.checks.find((c) => c.key === "registration")?.state).toBe("not_applicable");
    expect(summary.fullyVerified).toBe(true);
  });

  it("marks a document not applicable when the role does not require it", () => {
    const required = ["photo_id", "right_to_work", "enhanced_dbs", "mandatory_training_certificate"];
    const summary = summariseVerification({
      register: null,
      approvedDocumentCodes: required,
      requiredDocumentCodes: required,
      registrationVerified: false,
    });
    expect(summary.checks.find((c) => c.key === "references")?.state).toBe("not_applicable");
    expect(summary.fullyVerified).toBe(true);
  });

  it("lists the six checks the client asked for, registration second", () => {
    const summary = summariseVerification({
      register: "ofsted" as const,
      approvedDocumentCodes: [],
      requiredDocumentCodes: NURSE_REQUIRED,
      registrationVerified: false,
    });
    expect(summary.checks.map((c) => c.key)).toEqual([
      "identity",
      "registration",
      "right_to_work",
      "criminal_record",
      "references",
      "training",
    ]);
  });
});
