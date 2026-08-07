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
 * Document compliance is necessary but not sufficient:
 *  - the competency assessment must have been passed (spec item 2: "Assessment
 *    must be passed before application can be approved/completed"), and
 *  - an applicant who declared their mandatory training is NOT current stays
 *    pending "until updated training certificates are provided" (spec item 1) —
 *    encoded as: a training-not-current professional can only activate once an
 *    approved (and, enforced separately, in-date) training certificate exists.
 * A professional who attested training current, or who has no screening on
 * record, is gated by document compliance + assessment alone.
 *
 * On top of all of that, a REGULATED role (nurses on the NMC register, nannies
 * and childminders on the Ofsted register, physiotherapists on the HCPC
 * register) cannot be activated until an administrator has checked that register
 * and recorded the result — the client's 7 August requirement that "regulated
 * professionals cannot be approved until their registration has been verified
 * and remains valid". `registrationVerified` is true for roles that answer to no
 * register, so unregulated roles are unaffected.
 */
export function canActivateProfessional(args: {
  documentsCompliant: boolean;
  assessmentPassed: boolean;
  trainingAttestedCurrent: boolean | null;
  hasApprovedTrainingCertificate: boolean;
  registrationVerified?: boolean;
}): boolean {
  if (!args.documentsCompliant) return false;
  if (!args.assessmentPassed) return false;
  if (args.registrationVerified === false) return false;
  if (args.trainingAttestedCurrent === false) return args.hasApprovedTrainingCertificate;
  return true;
}
