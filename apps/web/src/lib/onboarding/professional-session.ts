import "server-only";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/require-auth";

/**
 * Ensure a professionals row exists for the signed-in user and return its id.
 * Onboarding steps (eligibility, assessment, documents) all reference it, so it
 * is created lazily on first onboarding action rather than via the signup trigger
 * (which would collide with existing DB test fixtures).
 */
export async function ensureProfessional(sessionUser?: User): Promise<string | null> {
  const user = sessionUser ?? (await getAuthUser());
  if (!user) return null;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return existing.id;

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Professional";
  const { data: created } = await supabase
    .from("professionals")
    .insert({ user_id: user.id, full_name: fullName })
    .select("id")
    .single();
  return created?.id ?? null;
}
