import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendNotification } from "@/lib/notifications/send";

/** Don't re-send a reminder for the SAME document more than once per window. */
const REMINDER_DEDUP_DAYS = 7;

export type ReminderAlert = {
  professionalId: string;
  documentId: string | null;
  dueDate: string | null;
};
export type ReminderTarget = { userId: string; documentId: string | null; dueDate: string | null };

/** Stable de-dup key for a (user, document) reminder. */
export function reminderKey(userId: string, documentId: string | null): string {
  return `${userId}::${documentId ?? "none"}`;
}

/**
 * Pure: from the outstanding alerts, pick which reminders to send — one per
 * (professional's user, document), skipping any (user, document) already
 * reminded within the window. Keeps the earliest due date when a document has
 * multiple alerts. This surfaces EACH expiring credential rather than only the
 * single earliest one across the whole professional.
 */
export function planReminders(
  alerts: ReminderAlert[],
  userIdByProf: Map<string, string | null>,
  alreadyNotified: Set<string>,
): ReminderTarget[] {
  const byKey = new Map<string, ReminderTarget>();
  for (const alert of alerts) {
    const userId = userIdByProf.get(alert.professionalId);
    if (!userId) continue;
    const key = reminderKey(userId, alert.documentId);
    if (alreadyNotified.has(key)) continue;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { userId, documentId: alert.documentId, dueDate: alert.dueDate });
    } else if (alert.dueDate && (!existing.dueDate || alert.dueDate < existing.dueDate)) {
      existing.dueDate = alert.dueDate;
    }
  }
  return [...byKey.values()];
}

/**
 * Send `compliance_expiry_reminder` notifications for every outstanding
 * (unacknowledged) compliance expiry alert, deduplicated per (professional,
 * document) so each expiring credential is surfaced at most once per
 * {@link REMINDER_DEDUP_DAYS} window.
 *
 * Shared by the admin "Send expiry reminders" action and the scheduled cron
 * route so the behaviour is identical whether triggered manually or daily.
 */
export async function sendDueComplianceReminders(): Promise<{ sent: number }> {
  const admin = createServiceClient();

  const { data: rawAlerts } = await admin
    .from("compliance_alerts")
    .select("professional_id, document_id, due_date")
    .eq("acknowledged", false);
  if (!rawAlerts || rawAlerts.length === 0) return { sent: 0 };
  const alerts: ReminderAlert[] = rawAlerts.map((a) => ({
    professionalId: a.professional_id,
    documentId: a.document_id,
    dueDate: a.due_date,
  }));

  // Resolve the (deduplicated) set of professional → user ids.
  const professionalIds = [...new Set(alerts.map((a) => a.professionalId))];
  const { data: pros } = await admin
    .from("professionals")
    .select("id, user_id")
    .in("id", professionalIds);
  const userIdByProf = new Map((pros ?? []).map((p) => [p.id, p.user_id]));

  // Reminders already sent (per user + document) within the dedup window.
  const since = new Date(Date.now() - REMINDER_DEDUP_DAYS * 86_400_000).toISOString();
  const candidateUserIds = [...new Set([...userIdByProf.values()].filter((u): u is string => Boolean(u)))];
  const alreadyNotified = new Set<string>();
  if (candidateUserIds.length > 0) {
    const { data: recent } = await admin
      .from("notifications")
      .select("recipient_user_id, payload")
      .eq("type", "compliance_expiry_reminder")
      .gte("created_at", since)
      .in("recipient_user_id", candidateUserIds);
    for (const n of recent ?? []) {
      const docId = (n.payload as { document_id?: string } | null)?.document_id ?? null;
      alreadyNotified.add(reminderKey(n.recipient_user_id, docId));
    }
  }

  const targets = planReminders(alerts, userIdByProf, alreadyNotified);
  for (const t of targets) {
    await sendNotification("compliance_expiry_reminder", t.userId, {
      due_date: t.dueDate ?? "",
      document_id: t.documentId ?? "",
    });
  }
  return { sent: targets.length };
}
