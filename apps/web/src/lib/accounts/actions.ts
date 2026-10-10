"use server";
import { persistClientProfile, persistOrganisationProfile } from "@/lib/accounts/profile-persistence";
import { clientSchema, organisationSchema } from "@/lib/validation/accounts";
import { validationMessage } from "@/lib/validation/form-messages";

import { getAccountCountry } from "@/lib/accounts/market-server";
import { organisationCategory } from "@/lib/accounts/organisation-categories";
import { isValidNif } from "@/lib/validation/nif";
import { requireAuth } from "@/lib/auth/require-auth";

export type ClientFormValues = {
  fullName: string;
  phone: string;
  emailContact: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
};

export type OrganisationFormValues = {
  organisationName: string;
  contactPerson: string;
  phone: string;
  emailContact: string;
  cqcRegistrationNumber: string;
  organisationCategory: string;
  taxNumber: string;
  licenceNumber: string;
  billingEmail: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  billingAddress: string;
};

export type AccountResult =
  | { ok: true }
  | { error: string; values?: ClientFormValues | OrganisationFormValues }
  | null;

const CLIENT_FIELD_LABELS: Record<string, string> = {
  fullName: "Full name",
  emailContact: "Contact email",
  addressLine1: "Address line 1",
  city: "City",
  postcode: "Postcode",
};

const ORGANISATION_FIELD_LABELS: Record<string, string> = {
  organisationName: "Organisation name",
  contactPerson: "Contact person",
  emailContact: "Contact email",
  addressLine1: "Address line 1",
  city: "City",
  postcode: "Postcode",
  billingEmail: "Billing email",
};

function parseClientFormValues(formData: FormData): ClientFormValues {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    emailContact: String(formData.get("emailContact") ?? ""),
    addressLine1: String(formData.get("addressLine1") ?? ""),
    addressLine2: String(formData.get("addressLine2") ?? ""),
    city: String(formData.get("city") ?? ""),
    postcode: String(formData.get("postcode") ?? ""),
  };
}

function parseOrganisationFormValues(formData: FormData): OrganisationFormValues {
  return {
    organisationName: String(formData.get("organisationName") ?? ""),
    contactPerson: String(formData.get("contactPerson") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    emailContact: String(formData.get("emailContact") ?? ""),
    cqcRegistrationNumber: String(formData.get("cqcRegistrationNumber") ?? ""),
    organisationCategory: String(formData.get("organisationCategory") ?? ""),
    taxNumber: String(formData.get("taxNumber") ?? ""),
    licenceNumber: String(formData.get("licenceNumber") ?? ""),
    billingEmail: String(formData.get("billingEmail") ?? ""),
    addressLine1: String(formData.get("addressLine1") ?? ""),
    addressLine2: String(formData.get("addressLine2") ?? ""),
    city: String(formData.get("city") ?? ""),
    postcode: String(formData.get("postcode") ?? ""),
    billingAddress: String(formData.get("billingAddress") ?? ""),
  };
}

export async function saveClientProfile(_prev: AccountResult, formData: FormData): Promise<AccountResult> {
  const parsed = clientSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: (formData.get("phone") as string) || undefined,
    emailContact: (formData.get("emailContact") as string) || undefined,
    addressLine1: (formData.get("addressLine1") as string) || undefined,
    addressLine2: (formData.get("addressLine2") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    postcode: (formData.get("postcode") as string) || undefined,
  });
  if (!parsed.success) {
    return {
      error: validationMessage(parsed.error, CLIENT_FIELD_LABELS),
      values: parseClientFormValues(formData),
    };
  }
  let user;
  try {
    user = await requireAuth();
  } catch {
    return { error: "You must be signed in.", values: parseClientFormValues(formData) };
  }

  const { error } = await persistClientProfile(user, parsed.data);
  if (error) {
    return { error: error.message, values: parseClientFormValues(formData) };
  }
  return { ok: true };
}

export async function saveOrganisationProfile(_prev: AccountResult, formData: FormData): Promise<AccountResult> {
  const parsed = organisationSchema.safeParse({
    organisationName: formData.get("organisationName"),
    contactPerson: formData.get("contactPerson"),
    phone: (formData.get("phone") as string) || undefined,
    emailContact: (formData.get("emailContact") as string) || undefined,
    addressLine1: (formData.get("addressLine1") as string) || undefined,
    addressLine2: (formData.get("addressLine2") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    postcode: (formData.get("postcode") as string) || undefined,
    cqcRegistrationNumber: (formData.get("cqcRegistrationNumber") as string) || undefined,
    billingEmail: (formData.get("billingEmail") as string) || undefined,
    billingAddress: (formData.get("billingAddress") as string) || undefined,
    organisationCategory: (formData.get("organisationCategory") as string) || undefined,
    taxNumber: (formData.get("taxNumber") as string) || undefined,
    licenceNumber: (formData.get("licenceNumber") as string) || undefined,
  });
  if (!parsed.success) {
    return {
      error: validationMessage(parsed.error, ORGANISATION_FIELD_LABELS),
      values: parseOrganisationFormValues(formData),
    };
  }
  let user;
  try {
    user = await requireAuth();
  } catch {
    return { error: "You must be signed in.", values: parseOrganisationFormValues(formData) };
  }

  const country = await getAccountCountry(user);
  const pt = country === "PT";
  const taxNumber = parsed.data.taxNumber?.replace(/\s+/g, "");
  if (pt && !organisationCategory(parsed.data.organisationCategory)) {
    return { error: "Choose the type of organisation.", values: parseOrganisationFormValues(formData) };
  }
  if (pt && !isValidNif(taxNumber)) {
    return { error: "Enter a valid NIPC (9 digits, as on the certidão permanente).", values: parseOrganisationFormValues(formData) };
  }
  const { error } = await persistOrganisationProfile(user, { ...parsed.data, taxNumber }, country);
  if (error) {
    return { error: error.message, values: parseOrganisationFormValues(formData) };
  }
  return { ok: true };
}
