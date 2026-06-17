"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { requireAuth } from "@/lib/auth/require-auth";

export type AnonymiseResult = { ok: true } | { error: string };

/**
 * GDPR right-to-erasure (admin-initiated). Anonymises a user's personal data
 * while retaining compliance and financial records:
 *  1. delete the user's uploaded files from storage,
 *  2. scrub PII across the relational tables atomically (fn_anonymise_user),
 *  3. scrub the auth.users email/metadata.
 * Founder and self accounts are protected.
 */
export async function anonymiseUser(userId: string): Promise<AnonymiseResult> {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  if (userId === adminId) return { error: "You cannot anonymise your own account." };

  const admin = createServiceClient();

  const { data: target } = await admin
    .from("users")
    .select("is_founder")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return { error: "User not found." };
  if (target.is_founder) return { error: "Founder accounts cannot be anonymised." };

  // Collect the user's stored files (profile photo + documents) to remove.
  const { data: prof } = await admin
    .from("professionals")
    .select("id, profile_photo_path")
    .eq("user_id", userId)
    .maybeSingle();
  const paths: string[] = [];
  if (prof?.profile_photo_path) paths.push(prof.profile_photo_path);
  if (prof?.id) {
    const { data: docs } = await admin
      .from("documents")
      .select("storage_path")
      .eq("professional_id", prof.id);
    for (const d of docs ?? []) if (d.storage_path) paths.push(d.storage_path);
  }
  if (paths.length > 0) {
    await admin.storage.from("documents").remove(paths);
  }

  // Atomic relational scrub — the authoritative step.
  const { error } = await admin.rpc("fn_anonymise_user", {
    p_user_id: userId,
    p_admin_id: adminId,
  });
  if (error) return { error: error.message };

  // Scrub the auth identity (best-effort — the PII in app tables is already gone).
  await admin.auth.admin.updateUserById(userId, {
    email: `anonymised+${userId}@deleted.invalid`,
    user_metadata: {},
  });

  return { ok: true };
}
