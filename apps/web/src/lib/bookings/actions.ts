"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  buildBookingInsert,
  careTypeError,
  isFutureStart,
  type ChosenCareType,
  type CreateBookingInput,
} from "./create";
import type { RateCard } from "@/lib/rates/snapshot";
import { applyTransition, type Actor } from "./transitions";
import { canAccept } from "./eligibility";
import { activeRoleIds } from "@/lib/roles/assignments";
import { sendNotification } from "@/lib/notifications/send";
import { createBookingSchema } from "@/lib/validation/bookings";
import { REQUESTER_ACCOUNT } from "./constants";
import {
  writeAcceptBooking,
  writeAssignBooking,
  writeCancelBooking,
  writeCompleteBooking,
  writeCreateBooking,
  writeDeclineBooking,
  writeMarkNoShow,
  writeUndoDecline,
} from "./service-writes";

export type BookingActionResult = { ok: true; id?: string } | { error: string };

function toRateCard(row: {
  id: string;
  client_charge_rate: number;
  professional_payout_rate: number;
  platform_fee_type: string;
  platform_fee_value: number | null;
  currency: string;
}): RateCard {
  return {
    id: row.id,
    client_charge_rate: Number(row.client_charge_rate),
    professional_payout_rate: Number(row.professional_payout_rate),
    platform_fee_type: row.platform_fee_type as RateCard["platform_fee_type"],
    platform_fee_value: row.platform_fee_value != null ? Number(row.platform_fee_value) : null,
    currency: row.currency.trim(),
  };
}

/** Derive cancel actor from the session — never trust a client-supplied role. */
async function resolveCancelActor(
  userId: string,
  booking: { requester_user_id: string; assigned_professional_id: string | null },
): Promise<Actor | null> {
  if (await requireAdmin()) return "admin";
  if (booking.requester_user_id === userId) {
    const admin = createServiceClient();
    const { data: client } = await admin.from("private_clients").select("id").eq("user_id", userId).maybeSingle();
    if (client) return "client";
    const { data: org } = await admin.from("organisations").select("id").eq("user_id", userId).maybeSingle();
    if (org) return "organisation";
    return null;
  }
  if (booking.assigned_professional_id) {
    const admin = createServiceClient();
    const { data: prof } = await admin
      .from("professionals")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (prof?.id === booking.assigned_professional_id) return "professional";
  }
  return null;
}

export async function createBooking(form: unknown): Promise<BookingActionResult> {
  const user = await requireAuth();
  const parsed = createBookingSchema.safeParse(form);
  if (!parsed.success) return { error: "Please check the booking details." };
  const formData = parsed.data;

  const admin = createServiceClient();

  const { data: account } = await admin
    .from("users")
    .select("account_type, is_founder")
    .eq("id", user.id)
    .maybeSingle();
  const expectedType = REQUESTER_ACCOUNT[formData.requesterType];
  if (!account?.is_founder && account?.account_type !== expectedType) {
    return { error: "You cannot create a booking for this account type." };
  }

  if (!isFutureStart(formData.scheduledStart)) {
    return { error: "Booking start must be in the future." };
  }

  const table = formData.requesterType === "client" ? "private_clients" : "organisations";
  const { data: profile } = await admin.from(table).select("id").eq("user_id", user.id).maybeSingle();
  if (!profile) return { error: `Complete your ${formData.requesterType} profile first.` };

  const { data: role } = await admin
    .from("professional_roles")
    .select("category_id")
    .eq("id", formData.professionalRoleId)
    .maybeSingle();
  if (!role) return { error: "That professional role is no longer available." };

  const [{ count: careTypesInCategory }, { data: chosenCareType }] = await Promise.all([
    admin
      .from("care_types")
      .select("id", { count: "exact", head: true })
      .eq("category_id", role.category_id)
      .eq("is_active", true),
    formData.careTypeId
      ? admin
          .from("care_types")
          .select("category_id, is_active")
          .eq("id", formData.careTypeId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  // A supplied id that matches no row would otherwise reach the insert as a
  // foreign-key violation with an opaque message.
  if (formData.careTypeId && !chosenCareType) {
    return { error: "That type of care is no longer offered." };
  }
  const careError = careTypeError({
    categoryOffersCareTypes: (careTypesInCategory ?? 0) > 0,
    roleCategoryId: role.category_id,
    chosen: chosenCareType
      ? ({ categoryId: chosenCareType.category_id, isActive: chosenCareType.is_active } satisfies ChosenCareType)
      : null,
  });
  if (careError) return { error: careError };

  const { data: rateCard } = await admin
    .from("rate_cards")
    .select("id, client_charge_rate, professional_payout_rate, platform_fee_type, platform_fee_value, currency")
    .eq("professional_role_id", formData.professionalRoleId)
    .is("effective_to", null)
    .maybeSingle();
  if (!rateCard) return { error: "No active rate card for this role yet." };

  let insert;
  try {
    insert = buildBookingInsert(
      {
        requesterUserId: user.id,
        privateClientId: formData.requesterType === "client" ? profile.id : null,
        organisationId: formData.requesterType === "organisation" ? profile.id : null,
        professionalRoleId: formData.professionalRoleId,
        careTypeId: formData.careTypeId,
        scheduledStart: formData.scheduledStart,
        scheduledEnd: formData.scheduledEnd,
        locationAddress: formData.locationAddress,
        locationPostcode: formData.locationPostcode,
        notes: formData.notes,
      } satisfies CreateBookingInput,
      toRateCard(rateCard),
    );
  } catch (e) {
    return { error: (e as Error).message };
  }

  const result = await writeCreateBooking(insert, user.id);
  if ("error" in result) return result;

  // Notify the requester, plus every professional of the matching role who is
  // currently eligible to accept — spec item 7: professionals receive booking
  // notifications when matching work becomes available.
  const { data: matches } = await admin
    .from("professional_role_assignments")
    .select("professionals(user_id, can_accept_bookings)")
    .eq("professional_role_id", formData.professionalRoleId)
    .eq("status", "active");
  await Promise.all([
    sendNotification("booking_request", user.id, { booking_id: result.id }),
    ...(matches ?? [])
      .map((m) => m.professionals as { user_id: string | null; can_accept_bookings: boolean | null } | null)
      .filter((p) => p?.can_accept_bookings)
      .map((p) => p?.user_id)
      .filter((id): id is string => Boolean(id))
      .map((id) => sendNotification("booking_available", id, { booking_id: result.id })),
  ]);
  return { ok: true, id: result.id };
}

export async function acceptBooking(bookingId: string): Promise<BookingActionResult> {
  const user = await requireAuth();
  const admin = createServiceClient();

  const { data: prof } = await admin
    .from("professionals")
    .select("id, can_accept_bookings, professional_role_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!prof) return { error: "Professional profile not found." };

  const { data: booking } = await admin.from("bookings").select("status, professional_role_id, requester_user_id, scheduled_start").eq("id", bookingId).single();
  if (!booking) return { error: "Booking not found." };

  if (new Date(booking.scheduled_start).getTime() <= Date.now()) {
    return { error: "This booking can no longer be accepted — its start time has passed." };
  }

  const t = applyTransition(booking.status, "accept", "professional");
  if (!t.ok) return { error: t.error };

  const eligible = canAccept(
    {
      canAcceptBookings: !!prof.can_accept_bookings,
      activeRoleIds: await activeRoleIds(admin, prof.id),
    },
    booking.professional_role_id,
  );
  if (!eligible.ok) return { error: eligible.reason };

  const result = await writeAcceptBooking(bookingId, prof.id, user.id);
  if ("error" in result) return result;

  await Promise.all([
    sendNotification("booking_confirmation", booking.requester_user_id, { booking_id: bookingId }),
    sendNotification("booking_confirmation", user.id, { booking_id: bookingId }),
  ]);
  return { ok: true };
}

export async function declineBooking(bookingId: string, reason?: string): Promise<BookingActionResult> {
  const user = await requireAuth();
  const admin = createServiceClient();
  const { data: prof } = await admin
    .from("professionals")
    .select("id, professional_role_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!prof) return { error: "Professional profile not found." };

  const { data: booking } = await admin
    .from("bookings")
    .select("status, professional_role_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return { error: "Booking not found." };

  const t = applyTransition(booking.status, "decline", "professional");
  if (!t.ok) return { error: t.error };
  if (!(await activeRoleIds(admin, prof.id)).includes(booking.professional_role_id)) {
    return { error: "This booking is for a different professional role." };
  }

  return writeDeclineBooking(bookingId, prof.id, reason);
}

/** Professional reverses an earlier decline so the open booking is offered again. */
export async function undoDecline(bookingId: string): Promise<BookingActionResult> {
  const user = await requireAuth();
  const admin = createServiceClient();
  const { data: prof } = await admin
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!prof) return { error: "Professional profile not found." };
  return writeUndoDecline(bookingId, prof.id);
}

export async function assignBooking(bookingId: string, professionalId: string): Promise<BookingActionResult> {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();
  const { data: booking } = await admin.from("bookings").select("status, requester_user_id, professional_role_id, scheduled_start").eq("id", bookingId).single();
  if (!booking) return { error: "Booking not found." };
  // A past-start booking can never be worked — mirror the guard acceptBooking has
  // so an admin cannot assign a professional to an already-started shift.
  if (new Date(booking.scheduled_start).getTime() <= Date.now()) {
    return { error: "This booking can no longer be assigned — its start time has passed." };
  }
  const t = applyTransition(booking.status, "assign", "admin");
  if (!t.ok) return { error: t.error };

  const { data: prof } = await admin
    .from("professionals")
    .select("id, user_id, can_accept_bookings, professional_role_id")
    .eq("id", professionalId)
    .maybeSingle();
  if (!prof) return { error: "Professional not found." };
  const eligible = canAccept(
    {
      canAcceptBookings: !!prof.can_accept_bookings,
      activeRoleIds: await activeRoleIds(admin, prof.id),
    },
    booking.professional_role_id,
  );
  if (!eligible.ok) return { error: eligible.reason };

  const result = await writeAssignBooking(bookingId, professionalId, adminId);
  if ("error" in result) return result;

  await Promise.all([
    sendNotification("booking_confirmation", booking.requester_user_id, { booking_id: bookingId }),
    ...(prof.user_id ? [sendNotification("booking_confirmation", prof.user_id, { booking_id: bookingId })] : []),
  ]);
  return { ok: true };
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<BookingActionResult> {
  const user = await requireAuth();
  const admin = createServiceClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("status, scheduled_start, requester_user_id, assigned_professional_id")
    .eq("id", bookingId)
    .single();
  if (!booking) return { error: "Booking not found." };

  const actor = await resolveCancelActor(user.id, booking);
  if (!actor) return { error: "You are not allowed to cancel this booking." };

  const t = applyTransition(booking.status, "cancel", actor);
  if (!t.ok) return { error: t.error };

  const isLastMinute = new Date(booking.scheduled_start).getTime() - Date.now() < 24 * 3_600_000;
  const result = await writeCancelBooking(bookingId, booking.status, user.id, actor, isLastMinute, reason);
  if ("error" in result) return result;

  // Notify both counterparties (requester + assigned professional) except whoever
  // initiated the cancellation, so e.g. an admin-initiated cancel reaches the client.
  const recipients = new Set<string>([booking.requester_user_id]);
  if (booking.assigned_professional_id) {
    const { data: p } = await admin.from("professionals").select("user_id").eq("id", booking.assigned_professional_id).maybeSingle();
    if (p?.user_id) recipients.add(p.user_id);
  }
  recipients.delete(user.id);
  await Promise.all(
    [...recipients].map((r) => sendNotification("booking_cancellation", r, { booking_id: bookingId })),
  );
  return { ok: true };
}

/** Professional (own booking) or admin marks a booking completed. */
export async function completeBooking(bookingId: string): Promise<BookingActionResult> {
  const user = await requireAuth();
  const admin = createServiceClient();
  const isAdmin = !!(await requireAdmin());

  const { data: booking } = await admin
    .from("bookings")
    .select("status, assigned_professional_id, scheduled_end")
    .eq("id", bookingId)
    .single();
  if (!booking) return { error: "Booking not found." };

  // A booking cannot be completed before its shift has actually finished —
  // otherwise a future booking could be marked done (and paid out) for work
  // that never happened.
  if (new Date(booking.scheduled_end).getTime() > Date.now()) {
    return { error: "This booking cannot be completed until the shift has ended." };
  }

  let actor: Actor = "admin";
  if (!isAdmin) {
    const { data: prof } = await admin.from("professionals").select("id").eq("user_id", user.id).maybeSingle();
    if (!prof || prof.id !== booking.assigned_professional_id) return { error: "This is not your booking." };
    actor = "professional";
  }

  const t = applyTransition(booking.status, "complete", actor);
  if (!t.ok) return { error: t.error };

  return writeCompleteBooking(bookingId, booking.status, user.id, isAdmin);
}

/** Admin marks an accepted/assigned booking as a no-show. */
export async function markNoShow(bookingId: string): Promise<BookingActionResult> {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();
  const { data: booking } = await admin.from("bookings").select("status").eq("id", bookingId).single();
  if (!booking) return { error: "Booking not found." };
  const t = applyTransition(booking.status, "no_show", "admin");
  if (!t.ok) return { error: t.error };
  return writeMarkNoShow(bookingId, booking.status, adminId);
}
