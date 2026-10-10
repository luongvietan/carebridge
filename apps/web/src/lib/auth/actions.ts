"use server";
import { headers } from "next/headers";
import { getSelectedCountry, isRegistrationOpen } from "@/lib/marketing/market-server";
import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { registerSchema } from "@/lib/validation/auth";
import { sendNotification } from "@/lib/notifications/send";
import { roleHome, type AccountType } from "@/lib/auth/rbac";
import { SIGN_IN_ERROR, SUSPENDED_ERROR } from "@/lib/auth/sign-in-messages";
import {
  FAILED_SIGN_IN_ACTION,
  FAILURE_RECORDING_WINDOW_MINUTES,
  describeAuthError,
  normalizeEmail,
  parseClientIp,
  shouldRecordFailure,
  truncateUserAgent,
} from "@/lib/auth/sign-in-rules";
import { recordFailedSignIn, recordSuccessfulSignIn } from "@/lib/auth/sign-in-audit";

const CONSENT_VERSION = "v1";

export type SignUpResult = { ok: true } | { error: string } | null;

export type SignInResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

/**
 * Sign a user in from the login form (client request, 7 Aug and 10 Aug).
 *
 * The password check happens here on the server rather than in the browser, so
 * the platform sees a failed attempt first-hand and can record it — not through
 * an endpoint anyone can post to, which would fill the audit log with noise,
 * but as a consequence of an attempt this code itself made against Supabase.
 *
 * Recording is throttled per address: after ten failures in fifteen minutes
 * further attempts are still refused exactly as before, just no longer written
 * down, so a flood of wrong passwords costs the attacker nothing but gains them
 * no entries — the provider rate-limits the endpoint itself regardless.
 *
 * The attempted address is stored in entity_id rather than summary, so pasting
 * an email into the audit search finds both its failures and its successes.
 */
export async function attemptSignIn(email: string, password: string): Promise<SignInResult> {
  const normalized = normalizeEmail(email);
  if (!normalized || !password) return { ok: false, error: SIGN_IN_ERROR };

  const admin = createServiceClient();
  const windowStart = new Date(
    Date.now() - FAILURE_RECORDING_WINDOW_MINUTES * 60_000,
  ).toISOString();
  const { count } = await admin
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("action", FAILED_SIGN_IN_ACTION)
    .eq("entity_id", normalized)
    .gte("occurred_at", windowStart);

  const requestHeaders = await headers();
  const ip =
    parseClientIp(requestHeaders.get("x-forwarded-for")) ??
    parseClientIp(requestHeaders.get("x-real-ip"));
  const userAgent = truncateUserAgent(requestHeaders.get("user-agent"));

  const recordFailure = (reason: string) =>
    shouldRecordFailure(count ?? 0)
      ? recordFailedSignIn({ email: normalized, reason, ip, userAgent, count: count ?? 0 })
      : Promise.resolve();

  const supabase = await createClient();
  // The trimmed original goes to the provider; only the audit key is normalised.
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error || !data.user) {
    await recordFailure(describeAuthError(error?.code));
    return { ok: false, error: SIGN_IN_ERROR };
  }

  const { data: row } = await supabase
    .from("users")
    .select("account_type, account_status")
    .eq("id", data.user.id)
    .single();
  if (row && row.account_status !== "active") {
    await supabase.auth.signOut();
    await recordFailure(`Credentials valid · account ${row.account_status}`);
    return { ok: false, error: SUSPENDED_ERROR };
  }

  await recordSuccessfulSignIn(data.user.id, data.user.email ?? normalized);

  return { ok: true, redirectTo: roleHome((row?.account_type ?? "private_client") as AccountType) };
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

  const market = await getSelectedCountry();
  if (!(await isRegistrationOpen(market))) {
    return { error: "As inscrições em Portugal abrem em breve. Contacte-nos para manifestar interesse." };
  }

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
        // Picks the language of Supabase's own sign-up and password-reset
        // e-mails (see supabase/templates): "PT" → European Portuguese.
        market,
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
