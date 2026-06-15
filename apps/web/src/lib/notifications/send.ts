import { createServiceClient } from "@/lib/supabase/service";

export type NotificationType =
  | "booking_request" | "booking_confirmation" | "booking_cancellation"
  | "assessment_result" | "compliance_approval";

export type ChannelSender = (msg: { to: string; subject: string; body: string }) => Promise<void>;

/** Pure: substitute {{var}} tokens. */
export function renderTemplate(
  tpl: { subject: string; body: string },
  payload: Record<string, string | number>,
): { subject: string; body: string } {
  const sub = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(payload[k] ?? ""));
  return { subject: sub(tpl.subject), body: sub(tpl.body) };
}

/** Prod sender via Resend HTTP API (no SDK dependency). */
export const resendSender: ChannelSender = async (msg) => {
  const key = process.env.RESEND_API_KEY!;
  const from = process.env.RESEND_FROM ?? "CareBridge Connect <noreply@carebridge.example>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: msg.to, subject: msg.subject, text: msg.body }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status}`);
};

/** Dev/default: the notifications row is the durable record; no external email. */
export const recordOnlySender: ChannelSender = async () => {};

export function defaultSender(): ChannelSender {
  return process.env.RESEND_API_KEY ? resendSender : recordOnlySender;
}

/**
 * Render the template for `type`, insert a notifications row, attempt delivery,
 * and mark the row sent/failed. Best-effort: never throws to the caller.
 */
export async function sendNotification(
  type: NotificationType,
  recipientUserId: string,
  payload: Record<string, string | number>,
  sender: ChannelSender = defaultSender(),
): Promise<void> {
  const admin = createServiceClient();
  try {
    const { data: tpl } = await admin
      .from("notification_templates")
      .select("subject, body")
      .eq("type", type)
      .single();
    if (!tpl) return;

    const { subject, body } = renderTemplate(tpl, payload);
    const { data: row } = await admin
      .from("notifications")
      .insert({ recipient_user_id: recipientUserId, type, payload, status: "queued" })
      .select("id")
      .single();

    const { data: u } = await admin.from("users").select("email").eq("id", recipientUserId).maybeSingle();
    try {
      if (u?.email) await sender({ to: u.email, subject, body });
      if (row) await admin.from("notifications").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", row.id);
    } catch {
      if (row) await admin.from("notifications").update({ status: "failed" }).eq("id", row.id);
    }
  } catch {
    // Notifications must never break a booking action.
  }
}
