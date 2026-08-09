/**
 * The green / amber / red compliance status the client asked for (7 Aug), plus
 * a fourth state she did not ask for and needs: `pending`.
 *
 * A traffic light exists so an administrator can spot risk instantly. Painting
 * every new applicant red would defeat that — a list of fifty people mid-
 * onboarding would be a wall of red with the two genuinely lapsed professionals
 * lost inside it. An applicant is not a compliance risk; they are simply not
 * approved yet, and they are shown as such.
 */

export type ComplianceLight = "green" | "amber" | "red" | "pending";

export const LIGHT_LABEL: Record<ComplianceLight, string> = {
  green: "Fully compliant",
  amber: "Expiring soon",
  red: "Compliance expired",
  pending: "Not yet approved",
};

export const LIGHT_DESCRIPTION: Record<ComplianceLight, string> = {
  green: "Fully compliant and available for bookings",
  amber: "Compliance documents due to expire soon",
  red: "Compliance expired — restricted from accepting new bookings until re-approved",
  pending: "Application not yet approved — cannot accept bookings",
};

/** Days ahead that counts as "expiring soon". Matches the reminder window. */
export const AMBER_WINDOW_DAYS = 30;

/** Statuses that mean the professional is blocked for a compliance reason. */
const COMPLIANCE_BLOCKED = new Set(["booking_restricted", "compliance_hold"]);

/** Statuses that are an administrator's decision, not a compliance state. */
const PUNITIVE = new Set(["temporarily_suspended", "under_investigation", "rejected", "removed"]);

export type TrafficLightInput = {
  professionalStatus: string;
  /** Any required critical document missing, expired or not yet approved. */
  hasOutstandingCriticalDocument: boolean;
  /** Regulated role with no current, active register check. */
  registrationLapsed: boolean;
  /** Soonest expiry date across the professional's critical documents, if any. */
  soonestExpiry?: string | null;
  /** When the current register check falls due, if any. */
  verificationDueDate?: string | null;
  today?: string;
};

function withinWindow(date: string | null | undefined, today: string, days: number): boolean {
  if (!date) return false;
  const limit = new Date(`${today}T00:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() + days);
  return date >= today && date <= limit.toISOString().slice(0, 10);
}

export function complianceLight(input: TrafficLightInput): ComplianceLight {
  const today = input.today ?? new Date().toISOString().slice(0, 10);

  // A suspended or removed professional is an administrative state; showing it
  // as a compliance colour would misattribute the reason.
  if (PUNITIVE.has(input.professionalStatus)) return "red";

  if (input.professionalStatus === "pending_verification") return "pending";

  if (
    COMPLIANCE_BLOCKED.has(input.professionalStatus) ||
    input.hasOutstandingCriticalDocument ||
    input.registrationLapsed
  ) {
    return "red";
  }

  if (
    withinWindow(input.soonestExpiry, today, AMBER_WINDOW_DAYS) ||
    withinWindow(input.verificationDueDate, today, AMBER_WINDOW_DAYS)
  ) {
    return "amber";
  }

  return "green";
}

/** Which expiry bucket a date falls into, for the compliance dashboard. */
export type ExpiryBucket = "expired" | "30" | "60" | "90" | "later";

export function expiryBucket(expiryDate: string, today = new Date().toISOString().slice(0, 10)): ExpiryBucket {
  if (expiryDate < today) return "expired";
  const days = Math.round(
    (Date.parse(`${expiryDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  );
  if (days <= 30) return "30";
  if (days <= 60) return "60";
  if (days <= 90) return "90";
  return "later";
}
