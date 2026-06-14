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
