"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { validateRateAmendment, type NewRate } from "./rates";

export type RateActionResult = { ok: true } | { error: string };

export async function amendRateCard(roleId: string, newRates: NewRate): Promise<RateActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const v = validateRateAmendment(newRates);
  if (!v.ok) return { error: v.error };

  const admin = createServiceClient();
  const { error } = await admin.rpc("amend_rate_card", {
    p_role_id: roleId,
    p_charge: v.rate.clientChargeRate,
    p_payout: v.rate.professionalPayoutRate,
    p_fee_type: v.rate.platformFeeType,
    p_fee_value: v.rate.platformFeeValue,
    p_currency: v.rate.currency,
    p_admin_id: adminId,
  });
  if (error) return { error: error.message };
  await admin.from("audit_log").insert({
    actor_user_id: adminId, actor_type: "admin", action: "rate_card.amended", entity_type: "professional_role", entity_id: roleId,
  });
  return { ok: true };
}
