import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { summariseVerification, type VerificationSummary } from "./verification-summary";
import { registerForRole } from "./regulated-roles";

/**
 * Load the evidence behind the Fully Verified badge for one professional:
 * documents that are approved AND in date, the documents their role requires,
 * and whether the register check is current.
 */
export async function loadVerificationSummary(
  admin: SupabaseClient<Database>,
  professionalId: string,
): Promise<VerificationSummary | null> {
  const { data: professional } = await admin
    .from("professionals")
    .select("id, professional_role_id, professional_roles(code, registration_register)")
    .eq("id", professionalId)
    .maybeSingle();
  if (!professional?.professional_role_id) return null;

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: requirements }, { data: documents }, { data: verified }] = await Promise.all([
    admin
      .from("compliance_requirements")
      .select("document_types(code)")
      .eq("professional_role_id", professional.professional_role_id),
    admin
      .from("documents")
      .select("expiry_date, document_types(code)")
      .eq("professional_id", professionalId)
      .eq("verification_status", "approved")
      .is("superseded_at", null),
    admin.rpc("fn_registration_verified", { p_professional_id: professionalId }),
  ]);

  const requiredDocumentCodes = (requirements ?? [])
    .map((r) => (r.document_types as { code: string } | null)?.code)
    .filter((code): code is string => Boolean(code));

  const approvedDocumentCodes = (documents ?? [])
    .filter((d) => !d.expiry_date || d.expiry_date >= today)
    .map((d) => (d.document_types as { code: string } | null)?.code)
    .filter((code): code is string => Boolean(code));

  return summariseVerification({
    register: registerForRole(
      professional.professional_roles as { registration_register: string | null } | null,
    ),
    approvedDocumentCodes,
    requiredDocumentCodes,
    registrationVerified: verified === true,
  });
}
