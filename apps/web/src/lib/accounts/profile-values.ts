import type { ClientFormValues, OrganisationFormValues } from "./actions";

/**
 * The saved profile, shaped as the profile form's values, so "Your profile"
 * opens with what was saved instead of an empty form. Saving is an upsert on
 * user_id (accounts/actions.ts), so a pre-filled form edits the same row.
 */

type ClientRow = {
  full_name: string | null;
  phone: string | null;
  email_contact: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
};

type OrganisationRow = {
  organisation_name: string | null;
  contact_person: string | null;
  phone: string | null;
  email_contact: string | null;
  cqc_registration_number: string | null;
  organisation_category: string | null;
  tax_number: string | null;
  licence_number: string | null;
  billing_email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  billing_address: string | null;
};

export const CLIENT_PROFILE_COLUMNS =
  "full_name, phone, email_contact, address_line1, address_line2, city, postcode";

export const ORGANISATION_PROFILE_COLUMNS =
  "organisation_name, contact_person, phone, email_contact, cqc_registration_number, organisation_category, tax_number, licence_number, billing_email, address_line1, address_line2, city, postcode, billing_address";

export function clientFormValues(row: ClientRow | null | undefined): ClientFormValues | undefined {
  if (!row) return undefined;
  return {
    fullName: row.full_name ?? "",
    phone: row.phone ?? "",
    emailContact: row.email_contact ?? "",
    addressLine1: row.address_line1 ?? "",
    addressLine2: row.address_line2 ?? "",
    city: row.city ?? "",
    postcode: row.postcode ?? "",
  };
}

export function organisationFormValues(row: OrganisationRow | null | undefined): OrganisationFormValues | undefined {
  if (!row) return undefined;
  return {
    organisationName: row.organisation_name ?? "",
    contactPerson: row.contact_person ?? "",
    phone: row.phone ?? "",
    emailContact: row.email_contact ?? "",
    cqcRegistrationNumber: row.cqc_registration_number ?? "",
    organisationCategory: row.organisation_category ?? "",
    taxNumber: row.tax_number ?? "",
    licenceNumber: row.licence_number ?? "",
    billingEmail: row.billing_email ?? "",
    addressLine1: row.address_line1 ?? "",
    addressLine2: row.address_line2 ?? "",
    city: row.city ?? "",
    postcode: row.postcode ?? "",
    billingAddress: row.billing_address ?? "",
  };
}
