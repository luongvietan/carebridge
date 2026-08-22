/**
 * A professional may hold several roles (client requirement, 22 June 2026), each
 * cleared separately, so eligibility asks which of their roles are active rather
 * than what their one role is.
 */
export type EligibilityCheck = { canAcceptBookings: boolean; activeRoleIds: string[] };

export function canAccept(
  prof: EligibilityCheck,
  bookingRoleId: string,
): { ok: true } | { ok: false; reason: string } {
  if (!prof.canAcceptBookings) {
    return { ok: false, reason: "You are not currently eligible to accept bookings." };
  }
  if (!prof.activeRoleIds.includes(bookingRoleId)) {
    return { ok: false, reason: "This booking is for a different professional role." };
  }
  return { ok: true };
}
