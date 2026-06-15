export type ProfessionalStatus =
  | "pending_verification" | "active" | "compliance_hold" | "booking_restricted"
  | "temporarily_suspended" | "under_investigation" | "rejected" | "removed";

export type StatusActionType =
  | "suspend" | "full_suspension" | "booking_restriction" | "compliance_hold"
  | "under_investigation" | "reinstate" | "reject" | "remove";

const RESULT: Record<StatusActionType, ProfessionalStatus> = {
  suspend: "temporarily_suspended",
  full_suspension: "temporarily_suspended",
  booking_restriction: "booking_restricted",
  compliance_hold: "compliance_hold",
  under_investigation: "under_investigation",
  reinstate: "active",
  reject: "rejected",
  remove: "removed",
};

// PROPOSED default matrix — flagged for Ana's sign-off. One-file change to adjust.
const ALLOWED: Record<ProfessionalStatus, StatusActionType[]> = {
  pending_verification: ["reject", "under_investigation", "compliance_hold"],
  active: ["suspend", "full_suspension", "booking_restriction", "compliance_hold", "under_investigation", "remove"],
  compliance_hold: ["reinstate", "suspend", "under_investigation", "remove"],
  booking_restricted: ["reinstate", "suspend", "remove"],
  temporarily_suspended: ["reinstate", "under_investigation", "remove"],
  under_investigation: ["reinstate", "suspend", "reject", "remove"],
  rejected: [],
  removed: [],
};

export function allowedActions(from: ProfessionalStatus): StatusActionType[] {
  return ALLOWED[from];
}

export function applyStatusAction(
  from: ProfessionalStatus,
  action: StatusActionType,
): { ok: true; to: ProfessionalStatus } | { ok: false; error: string } {
  if (!ALLOWED[from].includes(action)) return { ok: false, error: `Cannot ${action} a "${from}" professional.` };
  return { ok: true, to: RESULT[action] };
}
