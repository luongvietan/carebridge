import { describe, it, expect } from "vitest";
import { canAccept } from "./eligibility";

describe("canAccept", () => {
  it("allows an eligible, role-matched professional", () => {
    expect(canAccept({ canAcceptBookings: true, activeRoleIds: ["r1"] }, "r1")).toEqual({ ok: true });
  });
  it("blocks an ineligible professional", () => {
    expect(canAccept({ canAcceptBookings: false, activeRoleIds: ["r1"] }, "r1").ok).toBe(false);
  });
  it("blocks a role mismatch", () => {
    expect(canAccept({ canAcceptBookings: true, activeRoleIds: ["r2"] }, "r1").ok).toBe(false);
  });
  it("allows a booking in any role the professional holds actively", () => {
    expect(canAccept({ canAcceptBookings: true, activeRoleIds: ["r2", "r1"] }, "r1")).toEqual({
      ok: true,
    });
  });
  it("blocks a professional whose roles are all still pending", () => {
    expect(canAccept({ canAcceptBookings: true, activeRoleIds: [] }, "r1").ok).toBe(false);
  });
});
