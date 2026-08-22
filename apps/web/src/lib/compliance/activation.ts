import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { isCompliant, canActivateProfessional } from "./requirements";

export type ActivationState = {
  /** The primary role — what the profile-level messaging talks about. */
  roleId: string | null;
  documentsCompliant: boolean;
  /** False when the role answers to a register and no current check is on file. */
  registrationVerified: boolean;
  activate: boolean;
};

/**
 * Evaluate a professional's *current* activatability from live documents,
 * assessment results, and training attestation. Shared by the document-review
 * recompute and the admin reinstate flow so both honour the same gate, rather
 * than reinstate trusting a possibly-stale compliance_status.
 */
export async function evaluateActivation(
  admin: SupabaseClient<Database>,
  professionalId: string,
): Promise<ActivationState> {
  const { data: prof } = await admin
    .from("professionals")
    .select("professional_role_id")
    .eq("id", professionalId)
    .single();
  const roleId = prof?.professional_role_id ?? null;
  if (!roleId) {
    return { roleId: null, documentsCompliant: false, registrationVerified: false, activate: false };
  }

  const { data: reqs } = await admin
    .from("compliance_requirements")
    .select("document_type_id, document_types(is_compliance_critical)")
    .eq("professional_role_id", roleId);
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
  const documentsCompliant = isCompliant(requiredCritical, approvedSet);

  const { data: screening } = await admin
    .from("eligibility_screenings")
    .select("training_current")
    .eq("professional_id", professionalId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const trainingAttestedCurrent = screening ? screening.training_current : null;

  const { data: trainingType } = await admin
    .from("document_types")
    .select("id")
    .eq("code", "mandatory_training_certificate")
    .maybeSingle();
  const hasApprovedTrainingCertificate = trainingType ? approvedSet.has(trainingType.id) : false;

  const { count: passedCount } = await admin
    .from("assessment_attempts")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", professionalId)
    .eq("passed", true);
  const assessmentPassed = (passedCount ?? 0) > 0;

  // A regulated role needs a current, active register check on file. The DB
  // function is the same one the nightly sweep uses, so an approval and the
  // sweep can never disagree about whether somebody is verified.
  const { data: verified } = await admin.rpc("fn_registration_verified", {
    p_professional_id: professionalId,
  });
  const registrationVerified = verified !== false;

  const primaryActivatable = canActivateProfessional({
    documentsCompliant,
    assessmentPassed,
    trainingAttestedCurrent,
    hasApprovedTrainingCertificate,
    registrationVerified,
  });

  // A professional may hold several roles and is activatable as soon as ONE of
  // them is clear — a nurse whose childminder application is still missing a DBS
  // should be nursing. fn_role_assignment_eligible is the same rule as above,
  // asked of a named role, so a single-role professional gets an identical
  // answer by either route.
  let activate = primaryActivatable;
  if (!activate) {
    const { data: assignments } = await admin
      .from("professional_role_assignments")
      .select("professional_role_id")
      .eq("professional_id", professionalId)
      .neq("status", "withdrawn");
    for (const a of assignments ?? []) {
      if (a.professional_role_id === roleId) continue;
      const { data: eligible } = await admin.rpc("fn_role_assignment_eligible", {
        p_professional_id: professionalId,
        p_role_id: a.professional_role_id,
      });
      if (eligible === true) {
        activate = true;
        break;
      }
    }
  }

  return { roleId, documentsCompliant, registrationVerified, activate };
}
