"use server";
import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { registerSchema } from "@/lib/validation/auth";
import { sendNotification } from "@/lib/notifications/send";

const CONSENT_VERSION = "v1";

export type SignUpResult = { ok: true } | { error: string } | null;

/**
 * Record a successful sign-in in the audit trail (client request, 7 Aug).
 *
 * Called after the browser has authenticated, and it re-reads the session on the
 * server rather than trusting an id from the caller — otherwise anybody could
 * post entries claiming to be somebody else.
 *
 * FAILED sign-ins are deliberately not recorded here. Authentication happens
 * inside Supabase, so the platform never sees a failed attempt; the only way to
 * capture them from the app would be an endpoint anonymous callers can write to,
 * which turns the audit log into something anyone can fill with noise. Failed
 * attempts belong to a Supabase auth hook or its log drain.
 */
export async function recordSignIn(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await createServiceClient().from("audit_log").insert({
    actor_user_id: user.id,
    actor_type: "user",
    action: "auth.signed_in",
    entity_type: "user",
    entity_id: user.id,
    summary: user.email ?? null,
  });
}

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
