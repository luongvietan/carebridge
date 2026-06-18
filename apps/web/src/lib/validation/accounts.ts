import { z } from "zod";

const email = z.email();

export const clientSchema = z
  .object({
    fullName: z.string().min(1),
    phone: z.string().optional(),
    emailContact: email.optional(),
    // Spec §5 lists address as required registration data.
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    postcode: z.string().min(1),
  })
  // Spec §5: clients must provide reachable "contact information" — require at
  // least a phone number or a contact email (the auth email is for login only).
  .refine((v) => Boolean(v.phone?.trim()) || Boolean(v.emailContact?.trim()), {
    message: "Provide a phone number or a contact email so we can reach you.",
    path: ["emailContact"],
  });
export type ClientInput = z.infer<typeof clientSchema>;

export const organisationSchema = z.object({
  organisationName: z.string().min(1),
  contactPerson: z.string().min(1),
  phone: z.string().optional(),
  emailContact: email.optional(),
  // Spec §5 lists address as required registration data.
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  postcode: z.string().min(1),
  cqcRegistrationNumber: z.string().optional(),
  // Organisations are invoiced for bookings, so a billing email is required (spec §5).
  billingEmail: email,
  billingAddress: z.string().optional(),
});
export type OrganisationInput = z.infer<typeof organisationSchema>;
