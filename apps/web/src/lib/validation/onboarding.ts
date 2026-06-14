import { z } from "zod";

export const employmentStatuses = [
  "nhs_employed",
  "private_sector_employed",
  "self_employed",
  "not_employed_in_healthcare",
] as const;

export const employmentStatusLabels: Record<(typeof employmentStatuses)[number], string> = {
  nhs_employed: "Currently employed by the NHS",
  private_sector_employed: "Currently employed in the private healthcare sector",
  self_employed: "Self-employed healthcare professional",
  not_employed_in_healthcare: "Not currently employed within healthcare",
};

export const eligibilitySchema = z.object({
  employmentStatus: z.enum(employmentStatuses),
  // True only if ALL mandatory training was completed within the previous 12 months.
  trainingCurrent: z.boolean(),
});
export type EligibilityInput = z.infer<typeof eligibilitySchema>;

export const profileSchema = z.object({
  dateOfBirth: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  postcode: z.string().min(1),
  nationalInsuranceNo: z.string().optional(),
  professionalRoleId: z.string().uuid("Select your professional role"),
  professionalSummary: z.string().optional(),
  travelDistanceKm: z.coerce.number().int().min(0).max(1000).optional(),
  hasDrivingLicence: z.boolean().optional(),
  hasVehicle: z.boolean().optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;
