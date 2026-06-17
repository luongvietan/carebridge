"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { requireAuth } from "@/lib/auth/require-auth";
import { canSetAccountStatus, type AccountStatus } from "./account-status";
import { writeSetAccountStatus } from "./account-service";

export type AdminActionResult = { ok: true } | { error: string };

export async function setAccountStatus(userId: string, next: AccountStatus, reason?: string): Promise<AdminActionResult> {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();

  const { data: target } = await admin
    .from("users").select("account_type, is_founder, account_status").eq("id", userId).maybeSingle();
  if (!target) return { error: "User not found." };
  if (target.account_type === "admin" || target.is_founder) return { error: "Admin accounts cannot be suspended." };

  const t = canSetAccountStatus(target.account_status as AccountStatus, next);
  if (!t.ok) return { error: t.error };

  return writeSetAccountStatus(userId, next, adminId, reason);
}
