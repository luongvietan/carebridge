"use server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { createHash } from "node:crypto";
import { getSelectedCountry } from "@/lib/marketing/market-server";
import { renderEnquiryAcknowledgement, type EmailLocale } from "@/lib/email/render";
import { sendEmail } from "@/lib/email/transport";

export type ContactResult = { ok: true; acknowledgement: "sent" | "skipped" | "failed" | "duplicate"; locale: EmailLocale } | { error: string } | null;

const contactSchema = z.object({
  name: z.string().trim().min(1).max(150),
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
});

/** Persist a public Contact-form submission so it is never lost (spec §12). */
export async function submitContactMessage(
  _prev: ContactResult,
  formData: FormData,
): Promise<ContactResult> {
  if (formData.get("website")) return { error: "Please try again." };
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: (formData.get("subject") as string) || undefined,
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: "Please enter your name, a valid email, and a message." };
  }

  const admin = createServiceClient();
  const locale: EmailLocale = (await getSelectedCountry()) === "PT" ? "pt-PT" : "en-GB";
  // Serialize submissions per mailbox inside the database, across instances.
  const { data: outcome, error } = await admin.rpc("submit_contact_enquiry", {
    p_name: parsed.data.name, p_email: parsed.data.email,
    p_subject: parsed.data.subject ?? null, p_message: parsed.data.message,
  });
  if (error) return { error: "Sorry — we couldn't save your message. Please try again." };
  if (outcome === "duplicate") {
    return { ok: true, acknowledgement: "duplicate", locale };
  }
  if (outcome === "throttled") return { error: "Please wait a few minutes before sending another message." };
  if (outcome !== "saved") return { error: "Sorry — we couldn't save your message. Please try again." };
  try {
    const fingerprint = createHash("sha256").update(JSON.stringify(parsed.data)).digest("hex");
    const acknowledgement = await sendEmail({ to: parsed.data.email, ...renderEnquiryAcknowledgement(locale) }, `enquiry-${fingerprint}`);
    return { ok: true, acknowledgement, locale };
  } catch {
    return { ok: true, acknowledgement: "failed", locale };
  }
}
