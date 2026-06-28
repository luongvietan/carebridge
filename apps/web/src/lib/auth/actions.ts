"use server";
import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation/auth";
import { sendNotification } from "@/lib/notifications/send";

const CONSENT_VERSION = "v1";

export type SignUpResult = { ok: true } | { error: string } | null;

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) await supabase.auth.signOut();
  redirect("/login");
}

export async function signUp(_prev: SignUpResult, formData: FormData): Promise<SignUpResult> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    accountType: formData.get("accountType"),
    acceptedTerms: formData.get("acceptedTerms") === "on",
  });
  if (!parsed.success) return { error: "Please check the form and try again." };

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/confirm?next=/login`,
      // Privacy + T&C consent is recorded atomically by the handle_new_user
      // trigger (see migration 0038) so it can never be silently dropped if a
      // separate insert fails or the user object isn't returned.
      data: {
        account_type: parsed.data.accountType,
        full_name: parsed.data.fullName,
        accepted_terms: parsed.data.acceptedTerms ? "true" : "false",
        consent_version: CONSENT_VERSION,
      },
    },
  });
  if (error) return { error: error.message };

  // Registration confirmation email (best-effort; the users row is created by
  // the on_auth_user_created trigger as part of the signUp above).
  if (data.user) {
    await sendNotification("registration_confirmation", data.user.id, {
      full_name: parsed.data.fullName,
    });
  }

  return { ok: true };
}
