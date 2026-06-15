"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { clientSchema, organisationSchema } from "@/lib/validation/accounts";
import { createCustomer } from "@/lib/stripe/client";

export type AccountResult = { ok: true } | { error: string } | null;

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
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
  if (!parsed.success) return { error: "Please complete the required fields." };
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
    const customer = await createCustomer({
      email: parsed.data.emailContact ?? user.email,
      name: parsed.data.fullName,
    });
    stripeCustomerId = customer.id;
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
    city: (formData.get("city") as string) || undefined,
    postcode: (formData.get("postcode") as string) || undefined,
    cqcRegistrationNumber: (formData.get("cqcRegistrationNumber") as string) || undefined,
    billingEmail: (formData.get("billingEmail") as string) || undefined,
  });
  if (!parsed.success) return { error: "Please complete the required fields." };
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
    const customer = await createCustomer({
      email: parsed.data.billingEmail ?? user.email,
      name: parsed.data.organisationName,
    });
    stripeCustomerId = customer.id;
  }

  const { error } = await admin.from("organisations").upsert(
    {
      user_id: user.id,
      organisation_name: parsed.data.organisationName,
      contact_person: parsed.data.contactPerson,
      phone: parsed.data.phone ?? null,
      email_contact: parsed.data.emailContact ?? null,
      address_line1: parsed.data.addressLine1 ?? null,
      city: parsed.data.city ?? null,
      postcode: parsed.data.postcode ?? null,
      cqc_registration_number: parsed.data.cqcRegistrationNumber ?? null,
      billing_email: parsed.data.billingEmail ?? null,
      stripe_customer_id: stripeCustomerId,
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: error.message };
  return { ok: true };
}
