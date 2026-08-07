"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { requireAuth } from "@/lib/auth/require-auth";
import { sendNotification } from "@/lib/notifications/send";
import { checkSubmittedHours, workedHours } from "./rules";

export type TimesheetResult = { ok: true } | { error: string };

/**
 * The professional logs the hours they actually worked (client request, 7 Aug).
 * Submitted hours are a claim, not a fact: the client confirms them, and no
 * payout can be recorded until they do.
 */
export async function submitTimesheet(formData: FormData): Promise<TimesheetResult> {
  const user = await requireAuth();
  const admin = createServiceClient();

  const bookingId = String(formData.get("bookingId") ?? "");
  const actualStart = String(formData.get("actualStart") ?? "");
  const actualEnd = String(formData.get("actualEnd") ?? "");
  const breakMinutes = Number(formData.get("breakMinutes") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!bookingId) return { error: "Missing booking." };
  if (!Number.isFinite(breakMinutes)) return { error: "Enter the break in whole minutes." };

  const { data: professional } = await admin
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!professional) return { error: "Professional profile not found." };

  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, assigned_professional_id, requester_user_id, scheduled_end, duration_hours")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return { error: "Booking not found." };
  if (booking.assigned_professional_id !== professional.id) {
    return { error: "This is not your booking." };
  }
  if (booking.status !== "completed") {
    return { error: "Log your hours once the booking has been marked complete." };
  }

  const check = checkSubmittedHours({
    actualStart,
    actualEnd,
    breakMinutes,
    scheduledEnd: booking.scheduled_end,
    bookedHours: Number(booking.duration_hours ?? 0),
  });
  if (!check.ok) return { error: check.error };

  const { data: existing } = await admin
    .from("timesheets")
    .select("id, status")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (existing && existing.status !== "disputed") {
    return { error: "Hours have already been submitted for this booking." };
  }

  const row = {
    booking_id: bookingId,
    professional_id: professional.id,
    actual_start: new Date(actualStart).toISOString(),
    actual_end: new Date(actualEnd).toISOString(),
    break_minutes: Math.round(breakMinutes),
    professional_note: note,
    status: "submitted" as const,
    submitted_at: new Date().toISOString(),
    // Re-submission after a query clears the previous outcome.
    dispute_reason: null,
    confirmed_at: null,
    confirmed_by: null,
    auto_confirmed: false,
  };

  const { error } = existing
    ? await admin.from("timesheets").update(row).eq("id", existing.id)
    : await admin.from("timesheets").insert(row);
  if (error) return { error: error.message };

  await admin.from("audit_log").insert({
    actor_user_id: user.id,
    actor_type: "user",
    action: "timesheet.submitted",
    entity_type: "booking",
    entity_id: bookingId,
    summary: `${workedHours({ actualStart, actualEnd, breakMinutes })} hours submitted`,
  });

  await sendNotification("timesheet_submitted", booking.requester_user_id, {
    booking_id: bookingId,
    worked_hours: String(workedHours({ actualStart, actualEnd, breakMinutes })),
  });
  return { ok: true };
}

/** The client, the organisation or an administrator confirms the hours. */
export async function confirmTimesheet(timesheetId: string): Promise<TimesheetResult> {
  const user = await requireAuth();
  const admin = createServiceClient();
  const isAdmin = !!(await requireAdmin());

  const { data: sheet } = await admin
    .from("timesheets")
    .select("id, status, booking_id, professional_id, bookings(requester_user_id)")
    .eq("id", timesheetId)
    .maybeSingle();
  if (!sheet) return { error: "Timesheet not found." };

  const requesterId = (sheet.bookings as { requester_user_id: string } | null)?.requester_user_id;
  if (!isAdmin && requesterId !== user.id) {
    return { error: "You are not allowed to confirm these hours." };
  }
  if (sheet.status === "confirmed") return { ok: true };

  const { error } = await admin
    .from("timesheets")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      confirmed_by: user.id,
      auto_confirmed: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", timesheetId);
  if (error) return { error: error.message };

  await admin.from("audit_log").insert({
    actor_user_id: user.id,
    actor_type: isAdmin ? "admin" : "user",
    action: "timesheet.confirmed",
    entity_type: "booking",
    entity_id: sheet.booking_id,
  });

  const { data: pro } = await admin
    .from("professionals")
    .select("user_id")
    .eq("id", sheet.professional_id)
    .maybeSingle();
  if (pro?.user_id) {
    await sendNotification("timesheet_confirmed", pro.user_id, { booking_id: sheet.booking_id });
  }
  return { ok: true };
}

/** The client queries the hours; the professional can correct and re-submit. */
export async function disputeTimesheet(
  timesheetId: string,
  reason: string,
): Promise<TimesheetResult> {
  const user = await requireAuth();
  const admin = createServiceClient();
  const isAdmin = !!(await requireAdmin());

  const trimmed = reason.trim();
  if (!trimmed) return { error: "Tell us what is wrong with the hours." };

  const { data: sheet } = await admin
    .from("timesheets")
    .select("id, status, booking_id, professional_id, bookings(requester_user_id)")
    .eq("id", timesheetId)
    .maybeSingle();
  if (!sheet) return { error: "Timesheet not found." };

  const requesterId = (sheet.bookings as { requester_user_id: string } | null)?.requester_user_id;
  if (!isAdmin && requesterId !== user.id) {
    return { error: "You are not allowed to query these hours." };
  }
  if (sheet.status === "confirmed") {
    return { error: "These hours have already been confirmed." };
  }

  const { error } = await admin
    .from("timesheets")
    .update({ status: "disputed", dispute_reason: trimmed, updated_at: new Date().toISOString() })
    .eq("id", timesheetId);
  if (error) return { error: error.message };

  await admin.from("audit_log").insert({
    actor_user_id: user.id,
    actor_type: isAdmin ? "admin" : "user",
    action: "timesheet.disputed",
    entity_type: "booking",
    entity_id: sheet.booking_id,
    summary: trimmed,
  });

  const { data: pro } = await admin
    .from("professionals")
    .select("user_id")
    .eq("id", sheet.professional_id)
    .maybeSingle();
  if (pro?.user_id) {
    await sendNotification("timesheet_disputed", pro.user_id, {
      booking_id: sheet.booking_id,
      reason: trimmed,
    });
  }
  return { ok: true };
}
