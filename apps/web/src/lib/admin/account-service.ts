import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { AccountStatus } from "./account-status";

export type AccountWriteResult = { ok: true } | { error: string };

export async function writeSetAccountStatus(
  targetAccountId: string,
  next: AccountStatus,
  adminId: string,
  reason?: string,
): Promise<AccountWriteResult> {
  const admin = createServiceClient();
  const { error } = await admin.from("users").update({ account_status: next }).eq("id", targetAccountId);
  if (error) return { error: error.message };
  await admin.from("audit_log").insert({
    actor_user_id: adminId, actor_type: "admin", action: `account.${next}`, entity_type: "user", entity_id: targetAccountId, summary: reason ?? null,
  });
  return { ok: true };
}
