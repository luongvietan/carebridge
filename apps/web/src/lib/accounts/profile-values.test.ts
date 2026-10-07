import { describe, expect, it } from "vitest";
import { clientFormValues, organisationFormValues } from "./profile-values";

describe("saved profile as form values", () => {
  it("is undefined when nothing has been saved yet", () => {
    expect(clientFormValues(null)).toBeUndefined();
    expect(organisationFormValues(undefined)).toBeUndefined();
  });

  it("maps a client row, blanks for empty columns", () => {
    expect(
      clientFormValues({
        full_name: "Inês Costa",
        phone: null,
        email_contact: "ines@example.pt",
        address_line1: "Rua do Almada 210",
        address_line2: null,
        city: "Porto",
        postcode: "4050-032",
      }),
    ).toEqual({
      fullName: "Inês Costa",
      phone: "",
      emailContact: "ines@example.pt",
      addressLine1: "Rua do Almada 210",
      addressLine2: "",
      city: "Porto",
      postcode: "4050-032",
    });
  });

  it("keeps a Portuguese organisation's category, NIPC and licence", () => {
    const values = organisationFormValues({
      organisation_name: "Lar Santa Clara",
      contact_person: "Helena Martins",
      phone: "+351 213 456 789",
      email_contact: null,
      cqc_registration_number: null,
      organisation_category: "pt_erpi",
      tax_number: "509347126",
      licence_number: "ISS-ERPI-2019-0457",
      billing_email: "faturacao@example.pt",
      address_line1: "Rua de Santa Clara 18",
      address_line2: null,
      city: "Lisboa",
      postcode: "1100-472",
      billing_address: null,
    });
    expect(values).toMatchObject({
      organisationCategory: "pt_erpi",
      taxNumber: "509347126",
      licenceNumber: "ISS-ERPI-2019-0457",
      cqcRegistrationNumber: "",
      billingAddress: "",
    });
  });
});
