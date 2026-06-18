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
  it("requires a billing email (orgs are invoiced for bookings)", () => {
    expect(organisationSchema.safeParse({ organisationName: "Acme", contactPerson: "Jo" }).success).toBe(false);
  });
  it("rejects a malformed billing email", () => {
    expect(
      organisationSchema.safeParse({ organisationName: "Acme", contactPerson: "Jo", billingEmail: "nope" }).success,
    ).toBe(false);
  });
  it("accepts name + contact + billing email, CQC optional", () => {
    expect(
      organisationSchema.safeParse({
        organisationName: "Acme",
        contactPerson: "Jo",
        billingEmail: "billing@acme.test",
      }).success,
    ).toBe(true);
  });
});
