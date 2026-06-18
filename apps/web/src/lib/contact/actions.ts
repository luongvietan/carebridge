"use server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

export type ContactResult = { ok: true } | { error: string } | null;

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  subject: z.string().optional(),
  message: z.string().min(1),
});

/** Persist a public Contact-form submission so it is never lost (spec §12). */
export async function submitContactMessage(
  _prev: ContactResult,
  formData: FormData,
): Promise<ContactResult> {
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
  const { error } = await admin.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject ?? null,
    message: parsed.data.message,
  });
  if (error) return { error: "Sorry — we couldn't send your message. Please try again." };
  return { ok: true };
}
