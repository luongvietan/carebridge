"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { requireAuth } from "@/lib/auth/require-auth";
import { isGateEnabled } from "@/lib/auth/gate";
import { isMarketOpen } from "@/lib/marketing/market";
import { getAccountCountry } from "@/lib/accounts/market-server";
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
import { reviewDecision, roleFamilyOf, scoreRisk, validateSubmission, type RiskSubmission } from "@/lib/risk-assessment/score";
import { notifyAdminsOfReview } from "@/lib/risk-assessment/notify";
import { notifyMatchingProfessionals } from "./notify-matches";
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

export type BookingActionResult = { ok: true; id?: string; underReview?: boolean } | { error: string };

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
    .select("code, category_id, country_code")
    .eq("id", formData.professionalRoleId)
    .maybeSingle();
  if (!role) return { error: "That professional role is no longer available." };
  if (role.country_code !== await getAccountCountry(user)) {
    return { error: "Choose a professional role in your account's country." };
  }

  // A country that is not live yet cannot be booked into, whatever the form
  // was sent — except behind the private-preview gate, where it is being reviewed.
  const { data: roleCountry } = await admin
    .from("countries")
    .select("is_live")
    .eq("code", role.country_code)
    .maybeSingle();
  if (!roleCountry || !isMarketOpen(role.country_code, roleCountry.is_live, isGateEnabled())) {
    return { error: "That professional role is not available yet." };
  }

  // Private clients answer the risk and needs assessment first; it is scored
  // again here and decides whether the request goes live or waits for review.
  let risk: { submission: RiskSubmission; result: ReturnType<typeof scoreRisk>; decision: ReturnType<typeof reviewDecision> } | null = null;
  if (formData.requesterType === "client") {
    const submission = formData.riskAssessment;
    if (!submission) return { error: "Please complete the risk and needs assessment first." };
    const invalid = validateSubmission(submission);
    if (invalid === "emergency") {
      return { error: "This sounds like an emergency. Call the emergency services now (112 in Portugal, 999 in the UK)." };
    }
    if (invalid === "outdated") return { error: "The assessment has been updated. Please reload the page and complete it again." };
    if (invalid === "consent") return { error: "Please confirm consent to the assessment." };
    if (invalid) return { error: "Please answer every question in the risk and needs assessment." };
    const result = scoreRisk(submission.answers);
    risk = { submission, result, decision: reviewDecision(result, role.code) };
  }

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
      risk?.decision.requiresReview ? "pending_review" : "open",
    );
  } catch (e) {
    return { error: (e as Error).message };
  }

  const result = await writeCreateBooking(insert, user.id);
  if ("error" in result) return result;

  if (risk) {
    const { error: riskError } = await admin.from("booking_risk_assessments").insert({
      booking_id: result.id,
      questionnaire_version: risk.submission.version,
      respondent: risk.submission.respondent,
      answers: risk.submission.answers,
      score: risk.result.score,
      risk_level: risk.result.level,
      recommended_role_family: risk.result.recommendedFamily,
      chosen_role_family: roleFamilyOf(role.code),
      requires_review: risk.decision.requiresReview,
      review_reasons: risk.decision.reasons,
      consent_at: new Date().toISOString(),
      created_by: user.id,
    });
    if (riskError) {
      // Never leave a request live without its assessment.
      await admin.from("bookings").delete().eq("id", result.id);
      return { error: "Could not save the risk and needs assessment. Please try again." };
    }
    if (risk.decision.requiresReview) {
      await Promise.all([
        sendNotification("booking_under_review", user.id, { booking_id: result.id }),
        notifyAdminsOfReview(result.id, risk.result.level),
      ]);
      return { ok: true, id: result.id, underReview: true };
    }
  }

  await Promise.all([
    sendNotification("booking_request", user.id, { booking_id: result.id }),
    notifyMatchingProfessionals(result.id, formData.professionalRoleId),
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

  const isLastMinute =
    booking.status !== "pending_review" && new Date(booking.scheduled_start).getTime() - Date.now() < 24 * 3_600_000;
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
