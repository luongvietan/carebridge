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

/**
 * Whether a professional may be activated by an admin compliance decision.
 *
 * Document compliance is necessary but not sufficient. Spec item 1: an applicant
 * who declared their mandatory training is NOT current stays in a pending state
 * "until updated training certificates are provided". We encode that literally:
 * a training-not-current professional can only activate once an approved
 * (and — enforced separately — in-date) mandatory training certificate exists.
 * A professional who attested training current, or who has no screening on
 * record, is gated by document compliance alone.
 */
export function canActivateProfessional(args: {
  documentsCompliant: boolean;
  trainingAttestedCurrent: boolean | null;
  hasApprovedTrainingCertificate: boolean;
}): boolean {
  if (!args.documentsCompliant) return false;
  if (args.trainingAttestedCurrent === false) return args.hasApprovedTrainingCertificate;
  return true;
}
