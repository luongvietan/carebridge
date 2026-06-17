"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { requireAuth } from "@/lib/auth/require-auth";
import { isCompliant } from "@/lib/compliance/requirements";
import { sendNotification } from "@/lib/notifications/send";
import { sendDueComplianceReminders } from "@/lib/compliance/reminders";
import type { ProfessionalStatus } from "./status-machine";

export type ReviewDecision = "approved" | "rejected" | "further_info_required";

export async function runComplianceSweep(): Promise<{ ok: true } | { error: string }> {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();
  const { error } = await admin.rpc("fn_run_compliance_sweep");
  if (error) return { error: error.message };
  return { ok: true };
}

/** Admin-triggered send of outstanding compliance expiry reminder emails. */
export async function runComplianceReminders(): Promise<{ ok: true; sent: number } | { error: string }> {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const { sent } = await sendDueComplianceReminders();
  return { ok: true, sent };
}

export async function reviewDocument(
  documentId: string,
  decision: ReviewDecision,
  note?: string,
): Promise<{ ok: true } | { error: string }> {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };

  const admin = createServiceClient();
  const { data: doc } = await admin
    .from("documents")
    .select("id, professional_id")
    .eq("id", documentId)
    .single();
  if (!doc) return { error: "Document not found." };

  const { error } = await admin
    .from("documents")
    .update({
      verification_status: decision,
      verified_by: adminId,
      verified_at: new Date().toISOString(),
      rejection_reason: decision === "approved" ? null : (note ?? null),
    })
    .eq("id", documentId);
  if (error) return { error: error.message };

  await admin.from("audit_log").insert({
    actor_user_id: adminId,
    actor_type: "admin",
    action: `document.${decision}`,
    entity_type: "document",
    entity_id: documentId,
    summary: note ?? null,
  });

  await recomputeCompliance(doc.professional_id, adminId, decision);
  return { ok: true };
}

/** Professional statuses that are blocked *because of* compliance and should be
 * automatically cleared back to active once all required documents are approved.
 * Punitive/manual statuses (suspended, under investigation, rejected, removed)
 * are deliberately NOT auto-cleared by a document approval. */
const COMPLIANCE_BLOCKED: ProfessionalStatus[] = [
  "pending_verification",
  "booking_restricted",
  "compliance_hold",
];

/** Recompute a professional's compliance/professional status from their approved documents. */
async function recomputeCompliance(
  professionalId: string,
  adminId: string,
  decision: ReviewDecision,
): Promise<void> {
  const admin = createServiceClient();
  const { data: prof } = await admin
    .from("professionals")
    .select("professional_role_id, professional_status")
    .eq("id", professionalId)
    .single();
  if (!prof?.professional_role_id) return;

  const { data: reqs } = await admin
    .from("compliance_requirements")
    .select("document_type_id, document_types(is_compliance_critical)")
    .eq("professional_role_id", prof.professional_role_id);
  const requiredCritical: string[] = [];
  for (const r of reqs ?? []) {
    if ((r.document_types as { is_compliance_critical: boolean } | null)?.is_compliance_critical) {
      requiredCritical.push(r.document_type_id);
    }
  }

  const { data: approved } = await admin
    .from("documents")
    .select("document_type_id")
    .eq("professional_id", professionalId)
    .eq("verification_status", "approved");
  const approvedSet = new Set((approved ?? []).map((d) => d.document_type_id));

  if (isCompliant(requiredCritical, approvedSet)) {
    const becameActive = COMPLIANCE_BLOCKED.includes(
      prof.professional_status as ProfessionalStatus,
    );
    await admin
      .from("professionals")
      .update({
        compliance_status: "approved",
        professional_status: becameActive ? "active" : prof.professional_status,
      })
      .eq("id", professionalId);
    if (becameActive) {
      const { data: profUser } = await admin
        .from("professionals")
        .select("user_id")
        .eq("id", professionalId)
        .single();
      await Promise.all([
        admin.from("professional_status_actions").insert({
          professional_id: professionalId,
          action_type: "reinstate",
          resulting_status: "active",
          reason_text: "All required compliance documents approved",
          applied_by: adminId,
        }),
        admin.from("audit_log").insert({
          actor_user_id: adminId,
          actor_type: "admin",
          action: "professional.activated",
          entity_type: "professional",
          entity_id: professionalId,
          summary: "Compliance approved — professional activated",
        }),
        ...(profUser?.user_id
          ? [sendNotification("compliance_approval", profUser.user_id, { professional_id: professionalId })]
          : []),
      ]);
    }
  } else {
    // Not (yet) fully compliant. Preserve the explicit review outcome so the
    // 'Rejected' and 'Further Information Required' states the spec requires are
    // actually surfaced, rather than collapsing everything to 'pending_review'.
    const complianceStatus =
      decision === "rejected"
        ? "rejected"
        : decision === "further_info_required"
          ? "further_info_required"
          : "pending_review";
    await admin
      .from("professionals")
      .update({ compliance_status: complianceStatus })
      .eq("id", professionalId);
  }
}
