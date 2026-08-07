import { describe, it, expect } from "vitest";
import {
  registerForRole,
  requiresNmcRegistration,
  requiresOfstedRegistration,
} from "./regulated-roles";

describe("requiresOfstedRegistration", () => {
  it("covers nannies and childminders", () => {
    expect(requiresOfstedRegistration("nanny")).toBe(true);
    expect(requiresOfstedRegistration("childminder")).toBe(true);
  });
  it("excludes the childcare roles Ofsted does not register", () => {
    expect(requiresOfstedRegistration("babysitter")).toBe(false);
    expect(requiresOfstedRegistration("mothers_helper")).toBe(false);
  });
  it("treats a missing role as not requiring registration", () => {
    expect(requiresOfstedRegistration(null)).toBe(false);
    expect(requiresOfstedRegistration(undefined)).toBe(false);
  });
});

describe("requiresNmcRegistration", () => {
  it("covers all three nursing roles from the split", () => {
    expect(requiresNmcRegistration("adult_nurse")).toBe(true);
    expect(requiresNmcRegistration("paediatric_nurse")).toBe(true);
    expect(requiresNmcRegistration("mental_health_nurse")).toBe(true);
  });
  it("does not cover physiotherapists, who are HCPC-registered", () => {
    expect(requiresNmcRegistration("physiotherapist")).toBe(false);
  });
});

describe("registerForRole", () => {
  it("maps each regulated role to its register", () => {
    expect(registerForRole("childminder")).toBe("ofsted");
    expect(registerForRole("mental_health_nurse")).toBe("nmc");
    expect(registerForRole("physiotherapist")).toBe("hcpc");
  });
  it("returns null for roles governed by documents alone", () => {
    expect(registerForRole("healthcare_assistant")).toBeNull();
    expect(registerForRole("support_worker")).toBeNull();
    expect(registerForRole("babysitter")).toBeNull();
  });
});
