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
  // Spec §3 lists full name as a profile field. Editable here so a signup typo
  // or an email-derived fallback name can be corrected.
  fullName: z.string().min(1),
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
  // Ofsted registration number for childcare. Optional here because the schema
  // does not know which role was picked; saveProfile enforces that a nanny must
  // supply one. Format is only checked when a value is present: Ofsted URNs are
  // 6–8 digits, optionally prefixed (e.g. EY123456).
  ofstedRegistrationNumber: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[A-Za-z]{0,3}\d{6,8}$/.test(v.replace(/\s/g, "")),
      "Enter a valid Ofsted registration number, e.g. EY123456",
    ),
  // Right to work. British and Irish citizens evidence it with a passport;
  // everyone else with a Home Office share code. Optional in the schema and
  // enforced in saveProfile, in the same way as the Ofsted number, so the
  // per-basis rule lives in one place. Share codes are 9 alphanumeric
  // characters, conventionally shown in three groups of three.
  rightToWorkBasis: z.enum(["uk_irish_citizen", "share_code"]).optional(),
  rightToWorkShareCode: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[A-Za-z0-9]{9}$/.test(v.replace(/\s/g, "")),
      "Enter a valid 9-character share code, e.g. W12 A34 B56",
    ),
  // Portuguese Social Security authorisation for an Ama. Format is confirmed by
  // an administrator against the ISS itself, so this only checks it is a
  // plausible reference rather than inventing a pattern that could reject a
  // valid authorisation.
  issAuthorisationNumber: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[A-Za-z0-9./-]{4,20}$/.test(v.replace(/\s/g, "")),
      "Enter the authorisation number exactly as it appears on your ISS authorisation.",
    ),
  travelDistanceKm: z.coerce.number().int().min(0).max(1000).optional(),
  hasDrivingLicence: z.boolean().optional(),
  hasVehicle: z.boolean().optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;
