import { createCustomer } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/service";

async function tryCreateCustomer(args: { email?: string; name: string }): Promise<string | null> {
  try {
    return (await createCustomer(args)).id;
  } catch (error) {
    console.error("Stripe customer creation failed; saving profile without it.", error);
    return null;
  }
}

export async function persistClientProfile(user: { id: string; email?: string }, data: {
  fullName: string; phone?: string; emailContact?: string; addressLine1?: string; addressLine2?: string; city?: string; postcode?: string;
}) {
  const admin = createServiceClient();
  const { data: existing } = await admin.from("private_clients").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  const stripeCustomerId = existing?.stripe_customer_id ?? await tryCreateCustomer({ email: data.emailContact ?? user.email, name: data.fullName });
  return admin.from("private_clients").upsert({
    user_id: user.id, full_name: data.fullName, phone: data.phone ?? null, email_contact: data.emailContact ?? null,
    address_line1: data.addressLine1 ?? null, address_line2: data.addressLine2 ?? null, city: data.city ?? null,
    postcode: data.postcode ?? null, stripe_customer_id: stripeCustomerId,
  }, { onConflict: "user_id" });
}

export async function persistOrganisationProfile(user: { id: string; email?: string }, data: {
  organisationName: string; contactPerson: string; phone?: string; emailContact?: string; cqcRegistrationNumber?: string;
  organisationCategory?: string; taxNumber?: string; licenceNumber?: string; billingEmail?: string; addressLine1?: string;
  addressLine2?: string; city?: string; postcode?: string; billingAddress?: string;
}, country: string) {
  const admin = createServiceClient();
  const { data: existing } = await admin.from("organisations").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  const stripeCustomerId = existing?.stripe_customer_id ?? await tryCreateCustomer({ email: data.billingEmail ?? user.email, name: data.organisationName });
  const pt = country === "PT";
  return admin.from("organisations").upsert({
    user_id: user.id, organisation_name: data.organisationName, contact_person: data.contactPerson,
    phone: data.phone ?? null, email_contact: data.emailContact ?? null, address_line1: data.addressLine1 ?? null,
    address_line2: data.addressLine2 ?? null, city: data.city ?? null, postcode: data.postcode ?? null,
    cqc_registration_number: pt ? null : data.cqcRegistrationNumber ?? null, country_code: country,
    organisation_category: pt ? data.organisationCategory ?? null : null, tax_number: pt ? data.taxNumber ?? null : null,
    licence_number: pt ? data.licenceNumber?.trim() || null : null, billing_email: data.billingEmail ?? null,
    billing_address: data.billingAddress ?? null, stripe_customer_id: stripeCustomerId,
  }, { onConflict: "user_id" });
}
