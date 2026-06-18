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

function ageYears(dob: string, today: string): number {
  const [by, bm, bd] = dob.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age;
}

/**
 * Date of birth is optional, but when supplied it must be a real past date for a
 * plausible adult (age 16–100) — a DOB in the future or an implausible age is a
 * data-entry error. `today` is injectable for deterministic tests; ISO
 * `YYYY-MM-DD` strings compare chronologically as plain strings.
 */
export function isPlausibleDateOfBirth(value: string | null | undefined, today?: string): boolean {
  const v = (value ?? "").trim();
  if (!v) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) return false;
  const now = today ?? new Date().toISOString().slice(0, 10);
  if (v >= now) return false;
  const age = ageYears(v, now);
  return age >= 16 && age <= 100;
}

export const profileSchema = z.object({
  dateOfBirth: z
    .string()
    .optional()
    .refine(
      (v) => isPlausibleDateOfBirth(v),
      "Enter a valid date of birth (age 16–100, not in the future).",
    ),
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
  // Professional registration details (spec §3): regulatory body + number, e.g. NMC/HCPC.
  registrationBody: z.string().optional(),
  registrationNumber: z.string().optional(),
  travelDistanceKm: z.coerce.number().int().min(0).max(1000).optional(),
  hasDrivingLicence: z.boolean().optional(),
  hasVehicle: z.boolean().optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;
