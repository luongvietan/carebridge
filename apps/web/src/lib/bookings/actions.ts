"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { buildBookingInsert, isFutureStart, type CreateBookingInput } from "./create";
import type { RateCard } from "@/lib/rates/snapshot";
import { applyTransition, type Actor } from "./transitions";
import { canAccept } from "./eligibility";
import { sendNotification } from "@/lib/notifications/send";
import { createBookingSchema } from "@/lib/validation/bookings";

export type BookingActionResult = { ok: true; id?: string } | { error: string };

const REQUESTER_ACCOUNT: Record<"client" | "organisation", "private_client" | "organisation"> = {
  client: "private_client",
  organisation: "organisation",
};

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

async function authUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
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
  const parsed = createBookingSchema.safeParse(form);
  if (!parsed.success) return { error: "Please check the booking details." };
  const formData = parsed.data;

  const user = await authUser();
  if (!user) return { error: "You must be signed in." };
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

  const { data: booking, error } = await admin
    .from("bookings")
    .insert({ ...insert, created_by: user.id })
    .select("id")
    .single();
  if (error || !booking) return { error: error?.message ?? "Could not create booking." };

  await admin.from("booking_status_history").insert({ booking_id: booking.id, to_status: "open", changed_by: user.id });
  await admin.from("audit_log").insert({ actor_user_id: user.id, actor_type: "user", action: "booking.created", entity_type: "booking", entity_id: booking.id });
  await sendNotification("booking_request", user.id, { booking_id: booking.id });
  return { ok: true, id: booking.id };
}

export async function acceptBooking(bookingId: string): Promise<BookingActionResult> {
  const user = await authUser();
  if (!user) return { error: "You must be signed in." };
  const admin = createServiceClient();

  const { data: prof } = await admin
    .from("professionals")
    .select("id, can_accept_bookings, professional_role_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!prof) return { error: "Professional profile not found." };

  const { data: booking } = await admin.from("bookings").select("status, professional_role_id, requester_user_id").eq("id", bookingId).single();
  if (!booking) return { error: "Booking not found." };

  const t = applyTransition(booking.status, "accept", "professional");
  if (!t.ok) return { error: t.error };

  const eligible = canAccept(
    { canAcceptBookings: !!prof.can_accept_bookings, professionalRoleId: prof.professional_role_id },
    booking.professional_role_id,
  );
  if (!eligible.ok) return { error: eligible.reason };

  const { data: updated, error } = await admin
    .from("bookings")
    .update({ status: "accepted", assigned_professional_id: prof.id, accepted_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("status", "open")
    .is("assigned_professional_id", null)
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "This booking has already been taken." };

  await admin.from("booking_status_history").insert({ booking_id: bookingId, from_status: "open", to_status: "accepted", changed_by: user.id });
  await admin.from("audit_log").insert({ actor_user_id: user.id, actor_type: "user", action: "booking.accepted", entity_type: "booking", entity_id: bookingId });
  await sendNotification("booking_confirmation", booking.requester_user_id, { booking_id: bookingId });
  await sendNotification("booking_confirmation", user.id, { booking_id: bookingId });
  return { ok: true };
}

export async function declineBooking(bookingId: string, reason?: string): Promise<BookingActionResult> {
  const user = await authUser();
  if (!user) return { error: "You must be signed in." };
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
  if (prof.professional_role_id !== booking.professional_role_id) {
    return { error: "This booking is for a different professional role." };
  }

  const { error } = await admin
    .from("booking_declines")
    .upsert({ booking_id: bookingId, professional_id: prof.id, reason: reason ?? null }, { onConflict: "booking_id,professional_id" });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function assignBooking(bookingId: string, professionalId: string): Promise<BookingActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();
  const { data: booking } = await admin.from("bookings").select("status, requester_user_id, professional_role_id").eq("id", bookingId).single();
  if (!booking) return { error: "Booking not found." };
  const t = applyTransition(booking.status, "assign", "admin");
  if (!t.ok) return { error: t.error };

  const { data: prof } = await admin
    .from("professionals")
    .select("id, user_id, can_accept_bookings, professional_role_id")
    .eq("id", professionalId)
    .maybeSingle();
  if (!prof) return { error: "Professional not found." };
  const eligible = canAccept(
    { canAcceptBookings: !!prof.can_accept_bookings, professionalRoleId: prof.professional_role_id },
    booking.professional_role_id,
  );
  if (!eligible.ok) return { error: eligible.reason };

  const { data: updated, error } = await admin
    .from("bookings")
    .update({ status: "assigned", assigned_professional_id: professionalId, booking_type: "admin_assigned", assigned_by: adminId })
    .eq("id", bookingId)
    .eq("status", "open")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "This booking is no longer open." };

  await admin.from("booking_status_history").insert({ booking_id: bookingId, from_status: "open", to_status: "assigned", changed_by: adminId });
  await admin.from("audit_log").insert({ actor_user_id: adminId, actor_type: "admin", action: "booking.assigned", entity_type: "booking", entity_id: bookingId });
  await sendNotification("booking_confirmation", booking.requester_user_id, { booking_id: bookingId });
  if (prof.user_id) await sendNotification("booking_confirmation", prof.user_id, { booking_id: bookingId });
  return { ok: true };
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<BookingActionResult> {
  const user = await authUser();
  if (!user) return { error: "You must be signed in." };
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
  const fromStatus = booking.status;
  const { data: updated, error } = await admin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("status", fromStatus)
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "This booking has already been cancelled." };
  await admin.from("booking_status_history").insert({ booking_id: bookingId, from_status: fromStatus, to_status: "cancelled", changed_by: user.id, reason: reason ?? null });
  await admin.from("audit_log").insert({ actor_user_id: user.id, actor_type: actor === "admin" ? "admin" : "user", action: "booking.cancelled", entity_type: "booking", entity_id: bookingId, summary: reason ?? null });
  await admin.from("booking_cancellations").insert({
    booking_id: bookingId, cancelled_by: user.id, cancelled_role: actor, is_last_minute: isLastMinute, reason: reason ?? null,
  });
  let recipient: string | null = null;
  if (actor === "professional") recipient = booking.requester_user_id;
  else if (booking.assigned_professional_id) {
    const { data: p } = await admin.from("professionals").select("user_id").eq("id", booking.assigned_professional_id).maybeSingle();
    recipient = p?.user_id ?? null;
  }
  if (recipient) await sendNotification("booking_cancellation", recipient, { booking_id: bookingId });
  return { ok: true };
}
