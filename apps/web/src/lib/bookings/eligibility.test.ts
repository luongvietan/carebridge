import { describe, it, expect } from "vitest";
import { canAccept } from "./eligibility";

describe("canAccept", () => {
  it("allows an eligible, role-matched professional", () => {
    expect(canAccept({ canAcceptBookings: true, professionalRoleId: "r1" }, "r1")).toEqual({ ok: true });
  });
  it("blocks an ineligible professional", () => {
    expect(canAccept({ canAcceptBookings: false, professionalRoleId: "r1" }, "r1").ok).toBe(false);
  });
  it("blocks a role mismatch", () => {
    expect(canAccept({ canAcceptBookings: true, professionalRoleId: "r2" }, "r1").ok).toBe(false);
  });
});
