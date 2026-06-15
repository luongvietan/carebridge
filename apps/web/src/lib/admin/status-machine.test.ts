import { describe, it, expect } from "vitest";
import { applyStatusAction, allowedActions } from "./status-machine";

describe("applyStatusAction", () => {
  it("suspends an active professional", () => {
    expect(applyStatusAction("active", "suspend")).toEqual({ ok: true, to: "temporarily_suspended" });
  });
  it("reinstates a suspended professional to active", () => {
    expect(applyStatusAction("temporarily_suspended", "reinstate")).toEqual({ ok: true, to: "active" });
  });
  it("rejects an illegal action for the state", () => {
    expect(applyStatusAction("active", "reinstate").ok).toBe(false);
    expect(applyStatusAction("removed", "reinstate").ok).toBe(false);
  });
  it("maps booking_restriction and remove", () => {
    expect(applyStatusAction("active", "booking_restriction")).toEqual({ ok: true, to: "booking_restricted" });
    expect(applyStatusAction("active", "remove")).toEqual({ ok: true, to: "removed" });
  });
});

describe("allowedActions", () => {
  it("returns the legal actions for a state", () => {
    expect(allowedActions("temporarily_suspended")).toContain("reinstate");
    expect(allowedActions("removed")).toEqual([]);
  });
});
