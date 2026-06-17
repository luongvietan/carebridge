import { z } from "zod";

const uuid = z.uuid("Select your professional role");

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

// The 7 mandatory training types the applicant attests to per-item during
// eligibility screening (stable keys are persisted; labels are display-only).
export const mandatoryTrainingItems = [
  { key: "safeguarding_adults", label: "Safeguarding Adults" },
  { key: "safeguarding_children", label: "Safeguarding Children" },
  { key: "basic_life_support", label: "Basic Life Support" },
  { key: "infection_prevention_control", label: "Infection Prevention & Control" },
  { key: "health_safety", label: "Health & Safety" },
  { key: "moving_handling", label: "Moving & Handling" },
  { key: "gdpr_confidentiality", label: "GDPR & Confidentiality" },
] as const;

export type MandatoryTrainingKey = (typeof mandatoryTrainingItems)[number]["key"];

export const eligibilitySchema = z.object({
  employmentStatus: z.enum(employmentStatuses),
  // Per-item confirmation that each mandatory training was completed within the
  // previous 12 months. trainingCurrent is derived as: every item attested.
  trainingItems: z.record(z.string(), z.boolean()),
});
export type EligibilityInput = z.infer<typeof eligibilitySchema>;

export const profileSchema = z.object({
  dateOfBirth: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  postcode: z.string().min(1),
  // UK National Insurance number: 2 letters, 6 digits, 1 letter (spaces ignored).
  // Optional — only validated when a value is supplied.
  nationalInsuranceNo: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[A-Za-z]{2}\d{6}[A-Za-z]$/.test(v.replace(/\s/g, "")),
      "Enter a valid National Insurance number, e.g. QQ123456C",
    ),
  professionalRoleId: uuid,
  professionalSummary: z.string().optional(),
  travelDistanceKm: z.coerce.number().int().min(0).max(1000).optional(),
  hasDrivingLicence: z.boolean().optional(),
  hasVehicle: z.boolean().optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;
