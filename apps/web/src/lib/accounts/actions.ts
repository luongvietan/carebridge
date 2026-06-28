"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { clientSchema, organisationSchema } from "@/lib/validation/accounts";
import { validationMessage } from "@/lib/validation/form-messages";
import { createCustomer } from "@/lib/stripe/client";

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
    billingEmail: String(formData.get("billingEmail") ?? ""),
    addressLine1: String(formData.get("addressLine1") ?? ""),
    addressLine2: String(formData.get("addressLine2") ?? ""),
    city: String(formData.get("city") ?? ""),
    postcode: String(formData.get("postcode") ?? ""),
    billingAddress: String(formData.get("billingAddress") ?? ""),
  };
}

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Create a Stripe customer, returning its id — or null if Stripe is
 *  unavailable, so registration never fails on a payment-provider hiccup. */
async function tryCreateCustomer(args: { email?: string; name: string }): Promise<string | null> {
  try {
    const customer = await createCustomer(args);
    return customer.id;
  } catch (err) {
    console.error("Stripe customer creation failed; saving profile without it.", err);
    return null;
  }
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
  const user = await currentUser();
  if (!user) {
    return { error: "You must be signed in.", values: parseClientFormValues(formData) };
  }

  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("private_clients")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let stripeCustomerId = existing?.stripe_customer_id ?? null;
  if (!stripeCustomerId) {
    // Don't couple registration to the payment provider: if Stripe is
    // unavailable, still save the profile. Checkout creates the customer on
    // first payment, so a null id here is backfilled later.
    stripeCustomerId = await tryCreateCustomer({
      email: parsed.data.emailContact ?? user.email,
      name: parsed.data.fullName,
    });
  }

  const { error } = await admin.from("private_clients").upsert(
    {
      user_id: user.id,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone ?? null,
      email_contact: parsed.data.emailContact ?? null,
      address_line1: parsed.data.addressLine1 ?? null,
      address_line2: parsed.data.addressLine2 ?? null,
      city: parsed.data.city ?? null,
      postcode: parsed.data.postcode ?? null,
      stripe_customer_id: stripeCustomerId,
    },
    { onConflict: "user_id" },
  );
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
  });
  if (!parsed.success) {
    return {
      error: validationMessage(parsed.error, ORGANISATION_FIELD_LABELS),
      values: parseOrganisationFormValues(formData),
    };
  }
  const user = await currentUser();
  if (!user) {
    return { error: "You must be signed in.", values: parseOrganisationFormValues(formData) };
  }

  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("organisations")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let stripeCustomerId = existing?.stripe_customer_id ?? null;
  if (!stripeCustomerId) {
    stripeCustomerId = await tryCreateCustomer({
      email: parsed.data.billingEmail ?? user.email,
      name: parsed.data.organisationName,
    });
  }

  const { error } = await admin.from("organisations").upsert(
    {
      user_id: user.id,
      organisation_name: parsed.data.organisationName,
      contact_person: parsed.data.contactPerson,
      phone: parsed.data.phone ?? null,
      email_contact: parsed.data.emailContact ?? null,
      address_line1: parsed.data.addressLine1 ?? null,
      address_line2: parsed.data.addressLine2 ?? null,
      city: parsed.data.city ?? null,
      postcode: parsed.data.postcode ?? null,
      cqc_registration_number: parsed.data.cqcRegistrationNumber ?? null,
      billing_email: parsed.data.billingEmail ?? null,
      billing_address: parsed.data.billingAddress ?? null,
      stripe_customer_id: stripeCustomerId,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    return { error: error.message, values: parseOrganisationFormValues(formData) };
  }
  return { ok: true };
}
