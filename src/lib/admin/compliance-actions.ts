"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isCompliant } from "@/lib/compliance/requirements";

export type ReviewDecision = "approved" | "rejected" | "further_info_required";

/** Returns the caller's user id if they are an admin/founder, else null. */
async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: row } = await supabase
    .from("users")
    .select("account_type, is_founder")
    .eq("id", user.id)
    .maybeSingle();
  return row && (row.account_type === "admin" || row.is_founder) ? user.id : null;
}

export async function runComplianceSweep(): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();
  const { error } = await admin.rpc("fn_run_compliance_sweep");
  if (error) return { error: error.message };
  return { ok: true };
}

export async function reviewDocument(
  documentId: string,
  decision: ReviewDecision,
  note?: string,
): Promise<{ ok: true } | { error: string }> {
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

  await recomputeCompliance(doc.professional_id, adminId);
  return { ok: true };
}

/** Recompute a professional's compliance/professional status from their approved documents. */
async function recomputeCompliance(professionalId: string, adminId: string): Promise<void> {
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
  const requiredCritical = (reqs ?? [])
    .filter((r) => (r.document_types as { is_compliance_critical: boolean } | null)?.is_compliance_critical)
    .map((r) => r.document_type_id);

  const { data: approved } = await admin
    .from("documents")
    .select("document_type_id")
    .eq("professional_id", professionalId)
    .eq("verification_status", "approved");
  const approvedSet = new Set((approved ?? []).map((d) => d.document_type_id));

  if (isCompliant(requiredCritical, approvedSet)) {
    const becameActive = prof.professional_status === "pending_verification";
    await admin
      .from("professionals")
      .update({
        compliance_status: "approved",
        professional_status: becameActive ? "active" : prof.professional_status,
      })
      .eq("id", professionalId);
    if (becameActive) {
      await admin.from("professional_status_actions").insert({
        professional_id: professionalId,
        action_type: "reinstate",
        resulting_status: "active",
        reason_text: "All required compliance documents approved",
        applied_by: adminId,
      });
      await admin.from("audit_log").insert({
        actor_user_id: adminId,
        actor_type: "admin",
        action: "professional.activated",
        entity_type: "professional",
        entity_id: professionalId,
        summary: "Compliance approved — professional activated",
      });
    }
  } else {
    await admin.from("professionals").update({ compliance_status: "pending_review" }).eq("id", professionalId);
  }
}
