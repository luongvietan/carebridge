"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { requireAuth } from "@/lib/auth/require-auth";
import { applyTransition } from "@/lib/bookings/transitions";
import { writeCancelBooking } from "@/lib/bookings/service-writes";
import { notifyMatchingProfessionals } from "@/lib/bookings/notify-matches";
import { sendNotification } from "@/lib/notifications/send";

export type ReviewActionResult = { ok: true } | { error: string };

const MAX_NOTE = 1000;

async function loadForReview(bookingId: string) {
  const admin = createServiceClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("status, requester_user_id, professional_role_id, scheduled_start")
    .eq("id", bookingId)
    .maybeSingle();
  return { admin, booking };
}

async function recordDecision(
  admin: ReturnType<typeof createServiceClient>,
  bookingId: string,
  adminId: string,
  decision: "approved" | "declined",
  note: string | null,
) {
  await admin
    .from("booking_risk_assessments")
    .update({ review_decision: decision, review_note: note, reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq("booking_id", bookingId);
}

/** Admin publishes a request the risk assessment held: it opens to matching professionals. */
export async function approveBookingReview(bookingId: string, note?: string): Promise<ReviewActionResult> {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const cleanNote = note?.trim().slice(0, MAX_NOTE) || null;

  const { admin, booking } = await loadForReview(bookingId);
  if (!booking) return { error: "Booking not found." };
  const t = applyTransition(booking.status, "approve", "admin");
  if (!t.ok) return { error: "This request is no longer waiting for review." };
  if (new Date(booking.scheduled_start).getTime() <= Date.now()) {
    return { error: "This request's start time has passed. Decline it so the client can book again." };
  }

  const { data: updated, error } = await admin
    .from("bookings")
    .update({ status: "open" })
    .eq("id", bookingId)
    .eq("status", "pending_review")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "This request is no longer waiting for review." };

  await Promise.all([
    admin.from("booking_status_history").insert({
      booking_id: bookingId, from_status: "pending_review", to_status: "open", changed_by: adminId, reason: cleanNote,
    }),
    admin.from("audit_log").insert({
      actor_user_id: adminId, actor_type: "admin", action: "booking.review_approved",
      entity_type: "booking", entity_id: bookingId, summary: cleanNote,
    }),
    recordDecision(admin, bookingId, adminId, "approved", cleanNote),
  ]);
  await Promise.all([
    sendNotification("booking_review_approved", booking.requester_user_id, { booking_id: bookingId, note: cleanNote ?? "" }),
    notifyMatchingProfessionals(bookingId, booking.professional_role_id),
  ]);
  revalidatePath("/admin/bookings/review");
  return { ok: true };
}

/** Admin declines a held request: it is cancelled and the client is told why. */
export async function declineBookingReview(bookingId: string, note: string): Promise<ReviewActionResult> {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const cleanNote = note.trim().slice(0, MAX_NOTE);
  if (!cleanNote) return { error: "Please give the client a reason." };

  const { admin, booking } = await loadForReview(bookingId);
  if (!booking) return { error: "Booking not found." };
  const t = applyTransition(booking.status, "cancel", "admin");
  if (!t.ok || booking.status !== "pending_review") return { error: "This request is no longer waiting for review." };

  const result = await writeCancelBooking(bookingId, "pending_review", adminId, "admin", false, cleanNote);
  if ("error" in result) return result;

  await Promise.all([
    recordDecision(admin, bookingId, adminId, "declined", cleanNote),
    admin.from("audit_log").insert({
      actor_user_id: adminId, actor_type: "admin", action: "booking.review_declined",
      entity_type: "booking", entity_id: bookingId, summary: cleanNote,
    }),
  ]);
  await sendNotification("booking_review_declined", booking.requester_user_id, { booking_id: bookingId, note: cleanNote });
  revalidatePath("/admin/bookings/review");
  return { ok: true };
}
