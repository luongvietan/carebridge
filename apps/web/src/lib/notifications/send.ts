import { createServiceClient } from "@/lib/supabase/service";
import { renderEmail } from "@/lib/email/render";
import { sendEmail, type EmailDelivery } from "@/lib/email/transport";

export type NotificationType =
  | "booking_request" | "booking_available" | "booking_confirmation" | "booking_cancellation"
  | "assessment_result" | "compliance_approval"
  | "compliance_rejected" | "further_info_required"
  | "payment_receipt" | "payout_recorded"
  | "registration_confirmation" | "email_verification"
  | "compliance_expiry_reminder" | "password_reset"
  | "professional_rejected" | "account_removed" | "professional_suspended"
  | "timesheet_submitted" | "timesheet_confirmed" | "timesheet_disputed"
  | "message_received"
  | "booking_under_review" | "booking_review_approved" | "booking_review_declined" | "booking_review_required";

export type ChannelSender = (msg: { to: string; subject: string; body: string; html: string; text: string }) => Promise<void | EmailDelivery>;

/** Pure: substitute {{var}} tokens. */
export function renderTemplate(
  tpl: { subject: string; body: string },
  payload: Record<string, string | number>,
): { subject: string; body: string } {
  const sub = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(payload[k] ?? ""));
  return { subject: sub(tpl.subject), body: sub(tpl.body) };
}

const defaultSender: ChannelSender = (msg) => sendEmail(msg);

/**
 * Render the template for `type`, insert a notifications row, attempt delivery,
 * and mark the row sent/failed. Best-effort: never throws to the caller.
 */
/** Pure: a professional's country maps to the locale their mail is written in. */
export function localeForCountry(countryCode: string | null | undefined): string {
  return countryCode === "PT" ? "pt-PT" : "en-GB";
}

/**
 * Immutable users.country_code is authoritative. Historical profile country
 * supports legacy null snapshots; accounts without either deliberately use GB.
 */
export function recipientCountry(args: {
  accountCountry?: string | null;
  professionalCountry?: string | null;
  organisationCountry?: string | null;
}): string {
  return [args.accountCountry, args.professionalCountry, args.organisationCountry]
    .find((country) => country === "PT" || country === "GB") ?? "GB";
}

/** The template locale for a recipient: Portuguese for anyone in the Portuguese market. */
async function localeForRecipient(
  admin: ReturnType<typeof createServiceClient>,
  recipientUserId: string,
  accountCountry?: string | null,
): Promise<string> {
  if (accountCountry === "PT" || accountCountry === "GB") return localeForCountry(accountCountry);
  const [{ data: pro }, { data: org }] = await Promise.all([
    admin.from("professionals").select("country_code").eq("user_id", recipientUserId).maybeSingle(),
    admin.from("organisations").select("country_code").eq("user_id", recipientUserId).maybeSingle(),
  ]);
  return localeForCountry(
    recipientCountry({
      professionalCountry: pro?.country_code,
      organisationCountry: org?.country_code,
    }),
  );
}

export async function sendNotification(
  type: NotificationType,
  recipientUserId: string,
  payload: Record<string, string | number>,
  sender: ChannelSender = defaultSender,
): Promise<void> {
  const admin = createServiceClient();
  try {
    const { data: u, error: recipientError } = await admin.from("users")
      .select("email, country_code").eq("id", recipientUserId).maybeSingle();
    if (recipientError) throw new Error("Could not read notification recipient");
    // The recipient's language first, then that variant — falling back to the
    // English row wherever a translation has not landed yet.
    const locale = await localeForRecipient(admin, recipientUserId, u?.country_code);
    let { data: tpl } = await admin
      .from("notification_templates")
      .select("subject, body")
      .eq("type", type)
      .eq("locale", locale)
      .maybeSingle();
    if (!tpl && locale !== "en-GB") {
      ({ data: tpl } = await admin
        .from("notification_templates")
        .select("subject, body")
        .eq("type", type)
        .eq("locale", "en-GB")
        .single());
    }
    if (!tpl) return;

    const { subject, body } = renderTemplate(tpl, payload);
    const { data: row } = await admin
      .from("notifications")
      .insert({ recipient_user_id: recipientUserId, type, payload, status: "queued" })
      .select("id")
      .single();

    try {
      if (!u?.email) throw new Error("No notification recipient");
      const email = renderEmail({ subject, body, locale });
      const delivery = await sender({ to: u.email, body, ...email });
      // Record-only mode is queued; there was no delivery attempt.
      if (delivery === "skipped") return;
      if (row) await admin.from("notifications").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", row.id);
    } catch {
      if (row) await admin.from("notifications").update({ status: "failed" }).eq("id", row.id);
    }
  } catch {
    // Notifications must never break a booking action.
  }
}
