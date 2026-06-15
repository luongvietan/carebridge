"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { applyStatusAction, type ProfessionalStatus, type StatusActionType } from "./status-machine";

const REASON_CODES = [
  "last_minute_cancellation","repeated_cancellations","no_show","expired_dbs","expired_training",
  "expired_registration","expired_insurance","right_to_work_concern","safeguarding_concern",
  "client_complaint","conduct_concern","missing_documents","other",
] as const;
type ReasonCode = (typeof REASON_CODES)[number];

/** Actions that change status away from active/reinstate — require a reason for audit. */
const PUNITIVE: StatusActionType[] = [
  "suspend", "full_suspension", "booking_restriction", "compliance_hold",
  "under_investigation", "reject", "remove",
];

export type StatusActionResult = { ok: true } | { error: string };

export async function applyProfessionalStatusAction(
  professionalId: string,
  action: StatusActionType,
  details: { reasonCode?: string; reasonText?: string; internalNotes?: string; reviewDate?: string },
): Promise<StatusActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  if (PUNITIVE.includes(action)) {
    if (!details.reasonCode) return { error: "A reason code is required for this action." };
    if (details.reasonCode === "other" && !details.reasonText?.trim()) {
      return { error: "Please describe the reason when selecting 'other'." };
    }
  }
  if (details.reasonCode && !REASON_CODES.includes(details.reasonCode as ReasonCode)) {
    return { error: "Invalid reason code." };
  }
  const admin = createServiceClient();

  const { data: prof } = await admin.from("professionals").select("professional_status").eq("id", professionalId).single();
  if (!prof) return { error: "Professional not found." };

  const t = applyStatusAction(prof.professional_status as ProfessionalStatus, action);
  if (!t.ok) return { error: t.error };

  const { error } = await admin.from("professionals").update({ professional_status: t.to }).eq("id", professionalId);
  if (error) return { error: error.message };

  await admin.from("professional_status_actions").insert({
    professional_id: professionalId, action_type: action,
    reason_code: (details.reasonCode as ReasonCode) ?? null,
    reason_text: details.reasonText ?? null, internal_notes: details.internalNotes ?? null,
    review_date: details.reviewDate ?? null, resulting_status: t.to, applied_by: adminId,
  });
  await admin.from("audit_log").insert({
    actor_user_id: adminId, actor_type: "admin", action: `professional.${action}`,
    entity_type: "professional", entity_id: professionalId, summary: details.reasonText ?? null,
  });
  return { ok: true };
}
