import type { ProfessionalStatus } from "./status-machine";

export type ComplianceStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "compliance_expired"
  | "further_info_required";

/**
 * What a reinstatement should set, given the professional's *live* compliance.
 *
 * `can_accept_bookings` is a generated column (professional_status = 'active'
 * AND compliance_status = 'approved'). A reinstate lifts the manual hold, but
 * it must NOT restore booking ability if compliance lapsed while the
 * professional was suspended (e.g. their DBS expired). In that case we leave
 * them booking-restricted with a compliance status that keeps the gate closed
 * until an admin re-approves the updated documents.
 */
export function reinstateOutcome(state: {
  activatable: boolean;
  documentsCompliant: boolean;
}): { professionalStatus: ProfessionalStatus; complianceStatus: ComplianceStatus } {
  if (state.activatable) {
    return { professionalStatus: "active", complianceStatus: "approved" };
  }
  return {
    professionalStatus: "booking_restricted",
    complianceStatus: state.documentsCompliant ? "further_info_required" : "compliance_expired",
  };
}
