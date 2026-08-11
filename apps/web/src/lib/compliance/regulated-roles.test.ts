import { describe, it, expect } from "vitest";
import {
  referenceFieldFor,
  registerForRole,
  requiresIssAuthorisation,
  requiresOfstedRegistration,
  REFERENCE_LABEL,
  REGISTER_LABEL,
  REGULATOR_REGISTERS,
} from "./regulated-roles";

describe("registerForRole", () => {
  it("reads the register from the role row", () => {
    expect(registerForRole({ registration_register: "nmc" })).toBe("nmc");
    expect(registerForRole({ registration_register: "ordem_enfermeiros" })).toBe(
      "ordem_enfermeiros",
    );
    expect(registerForRole({ registration_register: "iss" })).toBe("iss");
  });

  it("returns null for a role governed by its documents alone", () => {
    expect(registerForRole({ registration_register: null })).toBeNull();
    expect(registerForRole(null)).toBeNull();
    expect(registerForRole(undefined)).toBeNull();
  });

  it("refuses a value that is not a register we know", () => {
    // A typo in the database must not silently become a register.
    expect(registerForRole({ registration_register: "ofstd" })).toBeNull();
  });
});

describe("referenceFieldFor", () => {
  it("sends each register to the column its reference lives in", () => {
    expect(referenceFieldFor("ofsted")).toBe("ofsted_urn");
    expect(referenceFieldFor("iss")).toBe("iss_authorisation");
    expect(referenceFieldFor("nmc")).toBe("registration_number");
    expect(referenceFieldFor("ordem_enfermeiros")).toBe("registration_number");
    expect(referenceFieldFor("ordem_fisioterapeutas")).toBe("registration_number");
    expect(referenceFieldFor("hcpc")).toBe("registration_number");
  });
});

describe("role predicates", () => {
  it("asks a childcare role for an Ofsted URN and an Ama for an ISS authorisation", () => {
    expect(requiresOfstedRegistration({ registration_register: "ofsted" })).toBe(true);
    expect(requiresOfstedRegistration({ registration_register: "iss" })).toBe(false);
    expect(requiresIssAuthorisation({ registration_register: "iss" })).toBe(true);
    expect(requiresIssAuthorisation({ registration_register: "ofsted" })).toBe(false);
  });
});

describe("register metadata", () => {
  it("names and labels every register, so no country is half-configured", () => {
    for (const register of REGULATOR_REGISTERS) {
      expect(REGISTER_LABEL[register]).toBeTruthy();
      expect(REFERENCE_LABEL[register]).toBeTruthy();
    }
  });
});
