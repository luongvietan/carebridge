import { describe, it, expect } from "vitest";
import { roleHome, isAreaAllowed } from "./rbac";

describe("rbac", () => {
  it("maps each role to its home area", () => {
    expect(roleHome("professional")).toBe("/professional");
    expect(roleHome("private_client")).toBe("/client");
    expect(roleHome("organisation")).toBe("/organisation");
    expect(roleHome("admin")).toBe("/admin");
  });

  it("blocks a professional from the admin area", () => {
    expect(isAreaAllowed("professional", "/admin/users", false)).toBe(false);
  });

  it("allows a professional within their own area", () => {
    expect(isAreaAllowed("professional", "/professional/bookings", false)).toBe(true);
  });

  it("lets the founder into any area", () => {
    expect(isAreaAllowed("professional", "/admin/users", true)).toBe(true);
  });

  it("treats public paths as allowed", () => {
    expect(isAreaAllowed("professional", "/about", false)).toBe(true);
  });
});
