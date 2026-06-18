import { z } from "zod";

const email = z.email();

export const clientSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().optional(),
  emailContact: email.optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
});
export type ClientInput = z.infer<typeof clientSchema>;

export const organisationSchema = z.object({
  organisationName: z.string().min(1),
  contactPerson: z.string().min(1),
  phone: z.string().optional(),
  emailContact: email.optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  cqcRegistrationNumber: z.string().optional(),
  // Organisations are invoiced for bookings, so a billing email is required (spec §5).
  billingEmail: email,
  billingAddress: z.string().optional(),
});
export type OrganisationInput = z.infer<typeof organisationSchema>;
