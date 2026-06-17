"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { requireAuth } from "@/lib/auth/require-auth";
import { applyStatusAction, type ProfessionalStatus, type StatusActionType } from "./status-machine";
import { PUNITIVE, REASON_CODES, type ReasonCode } from "./status-constants";
import { reinstateOutcome, type ComplianceStatus } from "./reinstate-compliance";
import { evaluateActivation } from "@/lib/compliance/activation";
import type { AccountStatus } from "./account-status";

export type StatusActionResult = { ok: true } | { error: string };

/**
 * Actions that also change platform-level account access. This is what makes a
 * "Full account suspension" different from a (booking-only) temporary suspension:
 * it flips users.account_status so the proxy blocks login entirely. Actions not
 * listed here leave account access untouched.
 */
const ACCOUNT_STATUS_FOR_ACTION: Partial<Record<StatusActionType, AccountStatus>> = {
  full_suspension: "suspended",
  remove: "deactivated",
  reinstate: "active",
};

export async function applyProfessionalStatusAction(
  professionalId: string,
  action: StatusActionType,
  details: { reasonCode?: string; reasonText?: string; internalNotes?: string; reviewDate?: string },
): Promise<StatusActionResult> {
  await requireAuth();
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

  const { data: prof } = await admin.from("professionals").select("professional_status, user_id").eq("id", professionalId).single();
  if (!prof) return { error: "Professional not found." };

  const t = applyStatusAction(prof.professional_status as ProfessionalStatus, action);
  if (!t.ok) return { error: t.error };

  // A reinstate lifts the manual hold, but must not blindly restore booking
  // ability: re-evaluate live compliance so a professional whose documents
  // lapsed while suspended stays booking-restricted until re-approved.
  let finalStatus: ProfessionalStatus = t.to;
  const update: { professional_status: ProfessionalStatus; compliance_status?: ComplianceStatus } = {
    professional_status: t.to,
  };
  if (action === "reinstate") {
    const { activate, documentsCompliant } = await evaluateActivation(admin, professionalId);
    const outcome = reinstateOutcome({ activatable: activate, documentsCompliant });
    finalStatus = outcome.professionalStatus;
    update.professional_status = outcome.professionalStatus;
    update.compliance_status = outcome.complianceStatus;
  }

  const { error } = await admin.from("professionals").update(update).eq("id", professionalId);
  if (error) return { error: error.message };

  // Drive platform account access for actions that gate login (full suspension /
  // removal block all access; reinstate restores it).
  const accountStatus = ACCOUNT_STATUS_FOR_ACTION[action];
  if (accountStatus && prof.user_id) {
    const { error: accErr } = await admin
      .from("users")
      .update({ account_status: accountStatus })
      .eq("id", prof.user_id);
    if (accErr) return { error: accErr.message };
  }

  // A reinstatement or removal resolves any still-open restriction on this
  // professional — stamp resolved_at so the audit trail records the date the
  // suspension was lifted (spec: "Date professional was reinstated or removed").
  if (action === "reinstate" || action === "remove") {
    await admin
      .from("professional_status_actions")
      .update({ resolved_at: new Date().toISOString() })
      .eq("professional_id", professionalId)
      .is("resolved_at", null);
  }

  await admin.from("professional_status_actions").insert({
    professional_id: professionalId, action_type: action,
    reason_code: (details.reasonCode as ReasonCode) ?? null,
    reason_text: details.reasonText ?? null, internal_notes: details.internalNotes ?? null,
    review_date: details.reviewDate ?? null, resulting_status: finalStatus, applied_by: adminId,
  });
  await admin.from("audit_log").insert({
    actor_user_id: adminId, actor_type: "admin", action: `professional.${action}`,
    entity_type: "professional", entity_id: professionalId, summary: details.reasonText ?? null,
  });
  return { ok: true };
}
