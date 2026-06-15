import { describe, it, expect } from "vitest";
import { clientSchema, organisationSchema } from "./accounts";

describe("clientSchema", () => {
  it("requires a full name", () => {
    expect(clientSchema.safeParse({}).success).toBe(false);
  });
  it("accepts a minimal client", () => {
    expect(clientSchema.safeParse({ fullName: "Jane Doe" }).success).toBe(true);
  });
  it("rejects a malformed contact email", () => {
    expect(clientSchema.safeParse({ fullName: "Jane", emailContact: "nope" }).success).toBe(false);
  });
});

describe("organisationSchema", () => {
  it("requires name and contact person", () => {
    expect(organisationSchema.safeParse({ organisationName: "Acme" }).success).toBe(false);
    expect(organisationSchema.safeParse({ contactPerson: "Jo" }).success).toBe(false);
  });
  it("accepts name + contact, CQC optional", () => {
    expect(organisationSchema.safeParse({ organisationName: "Acme", contactPerson: "Jo" }).success).toBe(true);
  });
});
