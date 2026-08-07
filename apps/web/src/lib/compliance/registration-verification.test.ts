import { describe, it, expect } from "vitest";
import {
  isValidNmcPin,
  isValidOfstedUrn,
  isValidReference,
  isVerificationCurrent,
  normaliseReference,
  verificationValidUntil,
} from "./registration-verification";

describe("verificationValidUntil", () => {
  it("falls twelve months after the check", () => {
    expect(verificationValidUntil(new Date("2026-08-07T09:00:00Z"))).toBe("2027-08-07");
  });
  it("handles a check made on the 31st of a month", () => {
    expect(verificationValidUntil(new Date("2026-01-31T00:00:00Z"))).toBe("2027-01-31");
  });
});

describe("isVerificationCurrent", () => {
  const today = "2026-08-07";

  it("accepts an active check still inside its window", () => {
    expect(isVerificationCurrent({ outcome: "active", valid_until: "2027-08-07" }, today)).toBe(true);
  });
  it("accepts a check expiring today", () => {
    expect(isVerificationCurrent({ outcome: "active", valid_until: today }, today)).toBe(true);
  });
  it("rejects a check that has gone stale", () => {
    expect(isVerificationCurrent({ outcome: "active", valid_until: "2026-08-06" }, today)).toBe(false);
  });
  it("rejects any outcome other than active, however recent", () => {
    expect(isVerificationCurrent({ outcome: "lapsed", valid_until: "2027-08-07" }, today)).toBe(false);
    expect(isVerificationCurrent({ outcome: "not_found", valid_until: "2027-08-07" }, today)).toBe(false);
    expect(isVerificationCurrent({ outcome: "details_mismatch", valid_until: "2027-08-07" }, today)).toBe(false);
  });
  it("rejects a professional with no verification at all", () => {
    expect(isVerificationCurrent(null, today)).toBe(false);
  });
});

describe("reference formats", () => {
  it("accepts a well-formed NMC PIN, spaced or not", () => {
    expect(isValidNmcPin("12A3456E")).toBe(true);
    expect(isValidNmcPin("12A 3456 E")).toBe(true);
  });
  it("rejects a PIN of the wrong shape", () => {
    expect(isValidNmcPin("123456")).toBe(false);
    expect(isValidNmcPin("AB123456")).toBe(false);
  });
  it("accepts Ofsted URNs with and without a prefix", () => {
    expect(isValidOfstedUrn("EY123456")).toBe(true);
    expect(isValidOfstedUrn("1234567")).toBe(true);
    expect(isValidOfstedUrn("registered")).toBe(false);
  });
  it("routes by register", () => {
    expect(isValidReference("nmc", "12A3456E")).toBe(true);
    expect(isValidReference("nmc", "EY123456")).toBe(false);
    expect(isValidReference("ofsted", "EY123456")).toBe(true);
    expect(isValidReference("hcpc", "PH123456")).toBe(true);
    expect(isValidReference("hcpc", "12A3456E")).toBe(false);
  });
  it("normalises for storage", () => {
    expect(normaliseReference(" ey123 456 ")).toBe("EY123456");
  });
});
