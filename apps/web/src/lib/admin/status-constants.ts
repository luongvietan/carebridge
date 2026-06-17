import type { StatusActionType } from "./status-machine";

export const REASON_CODES = [
  "last_minute_cancellation", "repeated_cancellations", "no_show", "expired_dbs", "expired_training",
  "expired_registration", "expired_insurance", "right_to_work_concern", "safeguarding_concern",
  "client_complaint", "conduct_concern", "missing_documents", "other",
] as const;

export type ReasonCode = (typeof REASON_CODES)[number];

/** Actions that change status away from active/reinstate — require a reason for audit. */
export const PUNITIVE: StatusActionType[] = [
  "suspend", "full_suspension", "booking_restriction", "compliance_hold",
  "under_investigation", "reject", "remove",
];
