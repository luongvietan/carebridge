"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { canSetAccountStatus, type AccountStatus } from "./account-status";

export type AdminActionResult = { ok: true } | { error: string };

export async function setAccountStatus(userId: string, next: AccountStatus, reason?: string): Promise<AdminActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();

  const { data: target } = await admin
    .from("users").select("account_type, is_founder, account_status").eq("id", userId).maybeSingle();
  if (!target) return { error: "User not found." };
  if (target.account_type === "admin" || target.is_founder) return { error: "Admin accounts cannot be suspended." };

  const t = canSetAccountStatus(target.account_status as AccountStatus, next);
  if (!t.ok) return { error: t.error };

  const { error } = await admin.from("users").update({ account_status: next }).eq("id", userId);
  if (error) return { error: error.message };
  await admin.from("audit_log").insert({
    actor_user_id: adminId, actor_type: "admin", action: `account.${next}`, entity_type: "user", entity_id: userId, summary: reason ?? null,
  });
  return { ok: true };
}
