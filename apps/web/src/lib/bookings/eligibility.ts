export type EligibilityCheck = { canAcceptBookings: boolean; professionalRoleId: string | null };

export function canAccept(
  prof: EligibilityCheck,
  bookingRoleId: string,
): { ok: true } | { ok: false; reason: string } {
  if (!prof.canAcceptBookings) {
    return { ok: false, reason: "You are not currently eligible to accept bookings." };
  }
  if (prof.professionalRoleId !== bookingRoleId) {
    return { ok: false, reason: "This booking is for a different professional role." };
  }
  return { ok: true };
}
