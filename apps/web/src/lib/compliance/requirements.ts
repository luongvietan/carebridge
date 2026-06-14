export type EligibilityOutcome = "continue" | "pending";

/**
 * Eligibility screening outcome. Mandatory training must all be current
 * (completed within the previous 12 months) to continue immediately;
 * otherwise the application proceeds but stays pending until updated.
 */
export function eligibilityOutcome(allTrainingCurrent: boolean): EligibilityOutcome {
  return allTrainingCurrent ? "continue" : "pending";
}

/**
 * A professional is compliant when every critical document type required for their
 * role has an approved document. No required critical types ⇒ vacuously compliant.
 */
export function isCompliant(requiredCriticalTypeIds: string[], approvedTypeIds: Set<string>): boolean {
  return requiredCriticalTypeIds.every((id) => approvedTypeIds.has(id));
}
