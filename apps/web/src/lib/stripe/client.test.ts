import { describe, it, expect } from "vitest";
import { createCustomer, stripe } from "./client";

describe("stripe()", () => {
  it("throws when STRIPE_SECRET_KEY is not set", () => {
    expect(() => stripe()).toThrow("STRIPE_SECRET_KEY is not set");
  });
});

// With no STRIPE_SECRET_KEY in the test env, createCustomer returns a deterministic stub.
describe("createCustomer (stub mode, no STRIPE_SECRET_KEY)", () => {
  it("returns a stub customer id", async () => {
    const c = await createCustomer({ email: "a@b.co", name: "Acme" });
    expect(c.id).toMatch(/^cus_stub_/);
  });
  it("returns unique ids", async () => {
    const a = await createCustomer({ name: "A" });
    const b = await createCustomer({ name: "B" });
    expect(a.id).not.toBe(b.id);
  });
});
