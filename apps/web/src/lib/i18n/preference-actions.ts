"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isPreferredLocale, LOCALE_COOKIE } from "./preference";
export async function setPreferredLocale(locale: string): Promise<{ ok: true } | { error: string }> {
  if (!isPreferredLocale(locale)) return { error: "Invalid language." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError && authError.name !== "AuthSessionMissingError") return { error: "Could not save language. Please try again." };
  if (user) {
    // The auth metadata trigger also updates users.preferred_locale for email.
    const { error } = await supabase.auth.updateUser({ data: { preferred_locale: locale } });
    if (error) return { error: "Could not save language. Please try again." };
  }
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 365 * 24 * 60 * 60, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  revalidatePath("/", "layout");
  return { ok: true };
}
