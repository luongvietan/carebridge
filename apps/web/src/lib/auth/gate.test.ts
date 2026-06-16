import { describe, it, expect } from "vitest";
import {
  createGateToken,
  isGatePathExempt,
  secureCompare,
  verifyAccessCode,
} from "./gate";

describe("gate", () => {
  it("creates a stable token for a secret", () => {
    const a = createGateToken("test-secret");
    const b = createGateToken("test-secret");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("verifies matching access codes safely", () => {
    expect(verifyAccessCode("my-code", "my-code")).toBe(true);
    expect(verifyAccessCode("wrong", "my-code")).toBe(false);
  });

  it("compares strings in constant time by length", () => {
    expect(secureCompare("abc", "abcd")).toBe(false);
  });

  it("exempts gate, webhook, and auth confirm paths", () => {
    expect(isGatePathExempt("/gate")).toBe(true);
    expect(isGatePathExempt("/api/stripe/webhook")).toBe(true);
    expect(isGatePathExempt("/auth/confirm")).toBe(true);
    expect(isGatePathExempt("/")).toBe(false);
    expect(isGatePathExempt("/login")).toBe(false);
  });
});
