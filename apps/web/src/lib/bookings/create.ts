import { buildSnapshot, type RateCard, type RateSnapshot } from "@/lib/rates/snapshot";

export type CreateBookingInput = {
  requesterUserId: string;
  privateClientId?: string | null;
  organisationId?: string | null;
  professionalRoleId: string;
  careTypeId?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  locationAddress: string;
  locationPostcode?: string | null;
  notes?: string | null;
};

export type BookingInsert = RateSnapshot & {
  requester_user_id: string;
  private_client_id: string | null;
  organisation_id: string | null;
  professional_role_id: string;
  care_type_id: string | null;
  scheduled_start: string;
  scheduled_end: string;
  duration_hours: number;
  location_address: string;
  location_postcode: string | null;
  notes: string | null;
  booking_type: "open_market";
  status: "open";
};

export function hoursBetween(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.round((ms / 3_600_000) * 100) / 100;
}

/** True when the booking start is strictly in the future. */
export function isFutureStart(startIso: string, now: Date = new Date()): boolean {
  return new Date(startIso).getTime() > now.getTime();
}

/** The care type chosen on the booking, as read back from `care_types`. */
export type ChosenCareType = { categoryId: string; isActive: boolean } | null;

/**
 * A category either offers care types or it does not, and the booking must
 * match. Childcare bookings without a type of care would reach the professional
 * as "Nanny, 8 hours" with no way to tell an overnight shift from an
 * after-school one; healthcare roles have no care types at all, so carrying one
 * would be meaningless. The form already enforces this — this is the rule for
 * every other route into `createBooking`.
 *
 * The category match is also a DB trigger (0063); repeating it here turns a
 * raised exception into a message the requester can act on.
 */
export function careTypeError(input: {
  categoryOffersCareTypes: boolean;
  roleCategoryId: string;
  chosen: ChosenCareType;
}): string | null {
  if (!input.categoryOffersCareTypes) {
    return input.chosen ? "This role does not offer a type of care." : null;
  }
  if (!input.chosen) return "Please choose a type of care for this booking.";
  if (!input.chosen.isActive) return "That type of care is no longer offered.";
  if (input.chosen.categoryId !== input.roleCategoryId) {
    return "That type of care does not apply to the selected role.";
  }
  return null;
}

export function buildBookingInsert(input: CreateBookingInput, rateCard: RateCard): BookingInsert {
  const hasClient = !!input.privateClientId;
  const hasOrg = !!input.organisationId;
  if (hasClient === hasOrg) {
    throw new Error("Exactly one of privateClientId or organisationId is required.");
  }
  const duration = hoursBetween(input.scheduledStart, input.scheduledEnd);
  if (duration <= 0) throw new Error("scheduled_end must be after scheduled_start.");

  return {
    ...buildSnapshot(rateCard),
    requester_user_id: input.requesterUserId,
    private_client_id: input.privateClientId ?? null,
    organisation_id: input.organisationId ?? null,
    professional_role_id: input.professionalRoleId,
    care_type_id: input.careTypeId ?? null,
    scheduled_start: input.scheduledStart,
    scheduled_end: input.scheduledEnd,
    duration_hours: duration,
    location_address: input.locationAddress,
    location_postcode: input.locationPostcode ?? null,
    notes: input.notes ?? null,
    booking_type: "open_market",
    status: "open",
  };
}
