"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { clientSchema, organisationSchema } from "@/lib/validation/accounts";
import { createCustomer } from "@/lib/stripe/client";

export type AccountResult = { ok: true } | { error: string } | null;

const FIELD_LABELS: Record<string, string> = {
  fullName: "Full name",
  organisationName: "Organisation name",
  contactPerson: "Contact person",
  emailContact: "Contact email",
  addressLine1: "Address line 1",
  city: "City",
  postcode: "Postcode",
  billingEmail: "Billing email",
};

/** Name the fields that failed validation rather than a generic catch-all. */
function validationMessage(error: z.ZodError): string {
  const fields = [
    ...new Set(error.issues.map((i) => FIELD_LABELS[String(i.path[0])] ?? String(i.path[0]))),
  ];
  return fields.length
    ? `Please check these fields: ${fields.join(", ")}.`
    : "Please complete the required fields.";
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
  if (!parsed.success) return { error: validationMessage(parsed.error) };
  const user = await currentUser();
  if (!user) return { error: "You must be signed in." };

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
  if (error) return { error: error.message };
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
  if (!parsed.success) return { error: validationMessage(parsed.error) };
  const user = await currentUser();
  if (!user) return { error: "You must be signed in." };

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
  if (error) return { error: error.message };
  return { ok: true };
}
