import { describe, it, expect } from "vitest";
import { applyTransition } from "./transitions";

describe("applyTransition", () => {
  it("professional accepts an open booking", () => {
    expect(applyTransition("open", "accept", "professional")).toEqual({ ok: true, to: "accepted" });
  });
  it("admin assigns an open booking", () => {
    expect(applyTransition("open", "assign", "admin")).toEqual({ ok: true, to: "assigned" });
  });
  it("client cancels an accepted booking", () => {
    expect(applyTransition("accepted", "cancel", "client")).toEqual({ ok: true, to: "cancelled" });
  });
  it("rejects a professional accepting an already-accepted booking", () => {
    const r = applyTransition("accepted", "accept", "professional");
    expect(r.ok).toBe(false);
  });
  it("rejects a client assigning", () => {
    expect(applyTransition("open", "assign", "client").ok).toBe(false);
  });
  it("rejects cancelling a cancelled booking", () => {
    expect(applyTransition("cancelled", "cancel", "admin").ok).toBe(false);
  });
});
