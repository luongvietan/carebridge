import { describe, it, expect } from "vitest";
import { registerSchema } from "./auth";

const base = {
  email: "a@b.co",
  password: "password1",
  fullName: "Al Pro",
  accountType: "professional" as const,
};

describe("registerSchema", () => {
  it("rejects when terms are not accepted", () => {
    expect(registerSchema.safeParse({ ...base, acceptedTerms: false }).success).toBe(false);
  });

  it("rejects a short password", () => {
    expect(registerSchema.safeParse({ ...base, password: "short", acceptedTerms: true }).success).toBe(false);
  });

  it("rejects an unknown account type", () => {
    expect(registerSchema.safeParse({ ...base, accountType: "admin", acceptedTerms: true }).success).toBe(false);
  });

  it("accepts a valid professional signup", () => {
    expect(registerSchema.safeParse({ ...base, acceptedTerms: true }).success).toBe(true);
  });
});
