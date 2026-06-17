import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { BookingInsert } from "./create";
import type { Actor, BookingStatus } from "./transitions";

export type WriteResult = { ok: true; id?: string } | { error: string };

export async function writeCreateBooking(
  insert: BookingInsert,
  actorId: string,
): Promise<{ ok: true; id: string } | { error: string }> {
  const admin = createServiceClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .insert({ ...insert, created_by: actorId })
    .select("id")
    .single();
  if (error || !booking) return { error: error?.message ?? "Could not create booking." };

  await Promise.all([
    admin.from("booking_status_history").insert({ booking_id: booking.id, to_status: "open", changed_by: actorId }),
    admin.from("audit_log").insert({ actor_user_id: actorId, actor_type: "user", action: "booking.created", entity_type: "booking", entity_id: booking.id }),
  ]);
  return { ok: true, id: booking.id };
}

export async function writeAcceptBooking(
  bookingId: string,
  professionalId: string,
  actorId: string,
): Promise<WriteResult> {
  const admin = createServiceClient();
  const { data: updated, error } = await admin
    .from("bookings")
    .update({ status: "accepted", assigned_professional_id: professionalId, accepted_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("status", "open")
    .is("assigned_professional_id", null)
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "This booking has already been taken." };

  await Promise.all([
    admin.from("booking_status_history").insert({ booking_id: bookingId, from_status: "open", to_status: "accepted", changed_by: actorId }),
    admin.from("audit_log").insert({ actor_user_id: actorId, actor_type: "user", action: "booking.accepted", entity_type: "booking", entity_id: bookingId }),
  ]);
  return { ok: true };
}

export async function writeDeclineBooking(
  bookingId: string,
  professionalId: string,
  reason?: string,
): Promise<WriteResult> {
  const admin = createServiceClient();
  const { error } = await admin
    .from("booking_declines")
    .upsert({ booking_id: bookingId, professional_id: professionalId, reason: reason ?? null }, { onConflict: "booking_id,professional_id" });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function writeAssignBooking(
  bookingId: string,
  professionalId: string,
  adminId: string,
): Promise<WriteResult> {
  const admin = createServiceClient();
  const { data: updated, error } = await admin
    .from("bookings")
    .update({ status: "assigned", assigned_professional_id: professionalId, booking_type: "admin_assigned", assigned_by: adminId })
    .eq("id", bookingId)
    .eq("status", "open")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "This booking is no longer open." };

  await Promise.all([
    admin.from("booking_status_history").insert({ booking_id: bookingId, from_status: "open", to_status: "assigned", changed_by: adminId }),
    admin.from("audit_log").insert({ actor_user_id: adminId, actor_type: "admin", action: "booking.assigned", entity_type: "booking", entity_id: bookingId }),
  ]);
  return { ok: true };
}

export async function writeCancelBooking(
  bookingId: string,
  fromStatus: BookingStatus,
  actorId: string,
  actor: Actor,
  isLastMinute: boolean,
  reason?: string,
): Promise<WriteResult> {
  const admin = createServiceClient();
  const { data: updated, error } = await admin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("status", fromStatus)
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "This booking has already been cancelled." };

  await Promise.all([
    admin.from("booking_status_history").insert({ booking_id: bookingId, from_status: fromStatus, to_status: "cancelled", changed_by: actorId, reason: reason ?? null }),
    admin.from("audit_log").insert({ actor_user_id: actorId, actor_type: actor === "admin" ? "admin" : "user", action: "booking.cancelled", entity_type: "booking", entity_id: bookingId, summary: reason ?? null }),
    admin.from("booking_cancellations").insert({
      booking_id: bookingId, cancelled_by: actorId, cancelled_role: actor, is_last_minute: isLastMinute, reason: reason ?? null,
    }),
  ]);
  return { ok: true };
}

export async function writeCompleteBooking(
  bookingId: string,
  fromStatus: BookingStatus,
  actorId: string,
  isAdmin: boolean,
): Promise<WriteResult> {
  const admin = createServiceClient();
  const { data: updated, error } = await admin
    .from("bookings").update({ status: "completed" }).eq("id", bookingId).eq("status", fromStatus).select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "This booking is no longer in a completable state." };

  await Promise.all([
    admin.from("booking_status_history").insert({ booking_id: bookingId, from_status: fromStatus, to_status: "completed", changed_by: actorId }),
    admin.from("audit_log").insert({ actor_user_id: actorId, actor_type: isAdmin ? "admin" : "user", action: "booking.completed", entity_type: "booking", entity_id: bookingId }),
  ]);
  return { ok: true };
}

export async function writeMarkNoShow(
  bookingId: string,
  fromStatus: BookingStatus,
  adminId: string,
): Promise<WriteResult> {
  const admin = createServiceClient();
  const { data: updated, error } = await admin
    .from("bookings").update({ status: "no_show" }).eq("id", bookingId).eq("status", fromStatus).select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "This booking is no longer in a no-show-able state." };

  await Promise.all([
    admin.from("booking_status_history").insert({ booking_id: bookingId, from_status: fromStatus, to_status: "no_show", changed_by: adminId }),
    admin.from("audit_log").insert({ actor_user_id: adminId, actor_type: "admin", action: "booking.no_show", entity_type: "booking", entity_id: bookingId }),
  ]);
  return { ok: true };
}
