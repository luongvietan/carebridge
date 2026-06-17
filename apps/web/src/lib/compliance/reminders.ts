import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendNotification } from "@/lib/notifications/send";

/** Don't re-send a reminder to the same professional more than once per window. */
const REMINDER_DEDUP_DAYS = 7;

/**
 * Send `compliance_expiry_reminder` notifications to every professional with an
 * outstanding (unacknowledged) compliance expiry alert, deduplicated so each
 * user receives at most one reminder per {@link REMINDER_DEDUP_DAYS} window.
 *
 * Shared by the admin "Send expiry reminders" action and the scheduled cron
 * route so the behaviour is identical whether triggered manually or daily.
 */
export async function sendDueComplianceReminders(): Promise<{ sent: number }> {
  const admin = createServiceClient();

  const { data: alerts } = await admin
    .from("compliance_alerts")
    .select("professional_id, due_date")
    .eq("acknowledged", false);
  if (!alerts || alerts.length === 0) return { sent: 0 };

  // Resolve the (deduplicated) set of professional → user ids.
  const professionalIds = [...new Set(alerts.map((a) => a.professional_id))];
  const { data: pros } = await admin
    .from("professionals")
    .select("id, user_id")
    .in("id", professionalIds);
  const userIdByProf = new Map((pros ?? []).map((p) => [p.id, p.user_id]));

  // Skip anyone already reminded within the dedup window.
  const since = new Date(Date.now() - REMINDER_DEDUP_DAYS * 86_400_000).toISOString();
  const candidateUserIds = [...new Set([...userIdByProf.values()].filter((u): u is string => Boolean(u)))];
  let recentlyNotified = new Set<string>();
  if (candidateUserIds.length > 0) {
    const { data: recent } = await admin
      .from("notifications")
      .select("recipient_user_id")
      .eq("type", "compliance_expiry_reminder")
      .gte("created_at", since)
      .in("recipient_user_id", candidateUserIds);
    recentlyNotified = new Set((recent ?? []).map((n) => n.recipient_user_id));
  }

  const earliestDueByUser = new Map<string, string | null>();
  for (const alert of alerts) {
    const userId = userIdByProf.get(alert.professional_id);
    if (!userId || recentlyNotified.has(userId)) continue;
    const current = earliestDueByUser.get(userId);
    if (current === undefined || (alert.due_date && (!current || alert.due_date < current))) {
      earliestDueByUser.set(userId, alert.due_date ?? null);
    }
  }

  let sent = 0;
  for (const [userId, dueDate] of earliestDueByUser) {
    await sendNotification("compliance_expiry_reminder", userId, {
      due_date: dueDate ?? "",
    });
    sent += 1;
  }
  return { sent };
}
