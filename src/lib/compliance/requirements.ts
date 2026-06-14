export type EligibilityOutcome = "continue" | "pending";

/**
 * Eligibility screening outcome. Mandatory training must all be current
 * (completed within the previous 12 months) to continue immediately;
 * otherwise the application proceeds but stays pending until updated.
 */
export function eligibilityOutcome(allTrainingCurrent: boolean): EligibilityOutcome {
  return allTrainingCurrent ? "continue" : "pending";
}
