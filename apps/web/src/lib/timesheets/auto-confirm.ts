import { createServiceClient } from "@/lib/supabase/service";
import { sendNotification } from "@/lib/notifications/send";
import { autoConfirmCutoff, isAutoConfirmable, AUTO_CONFIRM_WORKING_DAYS } from "./rules";

/**
 * Confirm timesheets the client has left unanswered.
 *
 * Requiring confirmation before payment protects the client; leaving it
 * unbounded would let a silent or absent client withhold somebody's pay
 * indefinitely, which is not what the client asked for and is not defensible to
 * the professional. Three working days is the window; weekends do not count.
 *
 * Disputed sheets are never auto-confirmed — a query is an answer.
 */
export async function autoConfirmDueTimesheets(now: Date = new Date()): Promise<{
  confirmed: number;
}> {
  const admin = createServiceClient();
  const cutoff = autoConfirmCutoff(now, AUTO_CONFIRM_WORKING_DAYS).toISOString();

  const { data: due } = await admin
    .from("timesheets")
    .select("id, booking_id, professional_id, status")
    .eq("status", "submitted")
    .lte("submitted_at", cutoff);

  let confirmed = 0;
  for (const sheet of due ?? []) {
    // Belt and braces against the query above: a queried sheet is never
    // auto-confirmed, however it came to be selected.
    if (!isAutoConfirmable(sheet.status)) continue;
    const { error } = await admin
      .from("timesheets")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        auto_confirmed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sheet.id)
      .eq("status", "submitted");
    if (error) continue;
    confirmed += 1;

    await admin.from("audit_log").insert({
      actor_type: "system",
      action: "timesheet.auto_confirmed",
      entity_type: "booking",
      entity_id: sheet.booking_id,
      summary: `No response within ${AUTO_CONFIRM_WORKING_DAYS} working days`,
    });

    const { data: pro } = await admin
      .from("professionals")
      .select("user_id")
      .eq("id", sheet.professional_id)
      .maybeSingle();
    if (pro?.user_id) {
      await sendNotification("timesheet_confirmed", pro.user_id, { booking_id: sheet.booking_id });
    }
  }
  return { confirmed };
}
