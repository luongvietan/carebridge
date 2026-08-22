import { describe, it, expect } from "vitest";
import { roleIsReady, roleOutstanding, type RoleGaps } from "./outstanding";

const ready: RoleGaps = {
  missingDocuments: [],
  assessmentPassed: true,
  registrationVerified: true,
  missingRegistrationReference: false,
  register: null,
};

describe("roleIsReady", () => {
  it("is ready when nothing is outstanding", () => {
    expect(roleIsReady(ready)).toBe(true);
  });

  it("is not ready while a required document is missing", () => {
    expect(roleIsReady({ ...ready, missingDocuments: ["DBS certificate"] })).toBe(false);
  });

  it("is not ready until this role's own assessment is passed", () => {
    expect(roleIsReady({ ...ready, assessmentPassed: false })).toBe(false);
  });

  it("is not ready while the register check is outstanding", () => {
    expect(roleIsReady({ ...ready, registrationVerified: false, register: "nmc" })).toBe(false);
  });

  it("is not ready without the registration number the register asks for", () => {
    expect(roleIsReady({ ...ready, missingRegistrationReference: true, register: "ofsted" })).toBe(
      false,
    );
  });
});

describe("roleOutstanding", () => {
  it("says nothing when the role is ready", () => {
    expect(roleOutstanding(ready)).toEqual([]);
  });

  it("names each missing document", () => {
    expect(roleOutstanding({ ...ready, missingDocuments: ["DBS certificate", "Insurance"] })).toEqual([
      "Upload and have approved: DBS certificate",
      "Upload and have approved: Insurance",
    ]);
  });

  it("asks for the reference before the check that depends on it", () => {
    const items = roleOutstanding({
      ...ready,
      assessmentPassed: false,
      registrationVerified: false,
      missingRegistrationReference: true,
      register: "ofsted",
    });
    expect(items[0]).toContain("Ofsted Unique Reference Number");
    // No point telling somebody we are waiting to check a number they have not given.
    expect(items.some((i) => i.includes("Awaiting our check"))).toBe(false);
  });

  it("puts the administrator's check last, once the professional has done their part", () => {
    const items = roleOutstanding({ ...ready, registrationVerified: false, register: "nmc" });
    expect(items).toEqual(["Awaiting our check of the NMC register"]);
  });

  it("leads with the assessment when that is what is missing", () => {
    expect(roleOutstanding({ ...ready, assessmentPassed: false })).toEqual([
      "Pass the assessment for this role",
    ]);
  });
});
