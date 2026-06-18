import { describe, it, expect } from "vitest";
import { clientSchema, organisationSchema } from "./accounts";

const clientAddress = { addressLine1: "1 High St", city: "London", postcode: "E1 6AN" };

describe("clientSchema", () => {
  it("requires a full name", () => {
    expect(clientSchema.safeParse({}).success).toBe(false);
  });
  it("requires an address (spec §5)", () => {
    expect(clientSchema.safeParse({ fullName: "Jane Doe" }).success).toBe(false);
  });
  it("accepts a client with name + address + a contact method", () => {
    expect(
      clientSchema.safeParse({ fullName: "Jane Doe", ...clientAddress, phone: "07700 900000" }).success,
    ).toBe(true);
    expect(
      clientSchema.safeParse({ fullName: "Jane Doe", ...clientAddress, emailContact: "jane@test.co" })
        .success,
    ).toBe(true);
  });
  it("rejects a client with no contact method (spec §5)", () => {
    expect(clientSchema.safeParse({ fullName: "Jane Doe", ...clientAddress }).success).toBe(false);
  });
  it("rejects a malformed contact email", () => {
    expect(
      clientSchema.safeParse({ fullName: "Jane", ...clientAddress, emailContact: "nope" }).success,
    ).toBe(false);
  });
});

describe("organisationSchema", () => {
  it("requires name and contact person", () => {
    expect(organisationSchema.safeParse({ organisationName: "Acme" }).success).toBe(false);
    expect(organisationSchema.safeParse({ contactPerson: "Jo" }).success).toBe(false);
  });
  it("requires a billing email (orgs are invoiced for bookings)", () => {
    expect(
      organisationSchema.safeParse({ organisationName: "Acme", contactPerson: "Jo", ...clientAddress }).success,
    ).toBe(false);
  });
  it("requires an address (spec §5)", () => {
    expect(
      organisationSchema.safeParse({
        organisationName: "Acme",
        contactPerson: "Jo",
        billingEmail: "billing@acme.test",
      }).success,
    ).toBe(false);
  });
  it("rejects a malformed billing email", () => {
    expect(
      organisationSchema.safeParse({
        organisationName: "Acme",
        contactPerson: "Jo",
        ...clientAddress,
        billingEmail: "nope",
      }).success,
    ).toBe(false);
  });
  it("accepts name + contact + address + billing email, CQC optional", () => {
    expect(
      organisationSchema.safeParse({
        organisationName: "Acme",
        contactPerson: "Jo",
        ...clientAddress,
        billingEmail: "billing@acme.test",
      }).success,
    ).toBe(true);
  });
});
