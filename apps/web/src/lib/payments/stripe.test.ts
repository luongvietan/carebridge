import { describe, it, expect } from "vitest";
import { createCustomer } from "./stripe";

describe("createCustomer (S2 stub)", () => {
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
