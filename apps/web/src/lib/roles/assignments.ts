import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { registerForRole, referenceFieldFor } from "@/lib/compliance/regulated-roles";
import type { RoleGaps, RoleAssignmentStatus } from "./outstanding";

export type RoleAssignment = {
  id: string;
  roleId: string;
  roleName: string;
  roleCode: string;
  status: RoleAssignmentStatus;
  isPrimary: boolean;
  assessmentLockedUntil: string | null;
  registrationReference: string | null;
  gaps: RoleGaps;
};

/**
 * Every role a professional holds, each with what it is still waiting for.
 *
 * The status column is maintained by the database (fn_recompute_role_assignments
 * and the nightly sweep); the gaps are recomputed here for display, from the
 * same evidence, so the page can explain a status rather than only state it.
 */
export async function loadRoleAssignments(
  admin: SupabaseClient<Database>,
  professionalId: string,
): Promise<RoleAssignment[]> {
  const [{ data: rows }, { data: prof }, { data: approvedDocs }] = await Promise.all([
    admin
      .from("professional_role_assignments")
      .select(
        "id, professional_role_id, status, is_primary, assessment_locked_until, registration_reference, professional_roles(id, name, code, registration_register)",
      )
      .eq("professional_id", professionalId)
      .order("is_primary", { ascending: false }),
    admin
      .from("professionals")
      .select("registration_number, ofsted_registration_number, iss_authorisation_number")
      .eq("id", professionalId)
      .maybeSingle(),
    admin
      .from("documents")
      .select("document_type_id")
      .eq("professional_id", professionalId)
      .eq("verification_status", "approved"),
  ]);

  if (!rows || rows.length === 0) return [];

  const approved = new Set((approvedDocs ?? []).map((d) => d.document_type_id));
  const roleIds = rows.map((r) => r.professional_role_id);

  const [{ data: reqs }, { data: passed }] = await Promise.all([
    admin
      .from("compliance_requirements")
      .select("professional_role_id, document_type_id, document_types(name, is_compliance_critical)")
      .in("professional_role_id", roleIds),
    admin
      .from("assessment_attempts")
      .select("professional_role_id")
      .eq("professional_id", professionalId)
      .eq("passed", true),
  ]);

  const passedRoles = new Set(
    (passed ?? []).map((a) => a.professional_role_id).filter((id): id is string => !!id),
  );

  const missingByRole = new Map<string, string[]>();
  for (const req of reqs ?? []) {
    const type = req.document_types as { name: string; is_compliance_critical: boolean } | null;
    if (!type?.is_compliance_critical) continue;
    if (approved.has(req.document_type_id)) continue;
    const list = missingByRole.get(req.professional_role_id) ?? [];
    list.push(type.name);
    missingByRole.set(req.professional_role_id, list);
  }

  // One round trip per regulated role: the register check is a database function
  // so that an approval and the nightly sweep can never disagree about it.
  const verified = await Promise.all(
    rows.map(async (row) => {
      const role = row.professional_roles as { registration_register: string | null } | null;
      if (!registerForRole(role)) return true;
      const { data } = await admin.rpc("fn_registration_verified_for_role", {
        p_professional_id: professionalId,
        p_role_id: row.professional_role_id,
      });
      return data !== false;
    }),
  );

  return rows.map((row, i) => {
    const role = row.professional_roles as {
      id: string;
      name: string;
      code: string;
      registration_register: string | null;
    } | null;
    const register = registerForRole(role);

    // The profile carries one column per KIND of reference, which is the answer
    // for the primary role; a second role that needs a different reference of
    // the same kind carries its own on the assignment. See migration 0083.
    let reference = row.registration_reference;
    if (!reference && row.is_primary && register && prof) {
      const field = referenceFieldFor(register);
      reference =
        field === "ofsted_urn"
          ? prof.ofsted_registration_number
          : field === "iss_authorisation"
            ? prof.iss_authorisation_number
            : prof.registration_number;
    }

    return {
      id: row.id,
      roleId: row.professional_role_id,
      roleName: role?.name ?? "Role",
      roleCode: role?.code ?? "",
      status: row.status as RoleAssignmentStatus,
      isPrimary: row.is_primary,
      assessmentLockedUntil: row.assessment_locked_until,
      registrationReference: reference,
      gaps: {
        missingDocuments: missingByRole.get(row.professional_role_id) ?? [],
        assessmentPassed: passedRoles.has(row.professional_role_id),
        registrationVerified: verified[i],
        missingRegistrationReference: !!register && !reference?.trim(),
        register,
      },
    };
  });
}

/** The roles a professional may currently be assigned bookings in. */
export async function activeRoleIds(
  admin: SupabaseClient<Database>,
  professionalId: string,
): Promise<string[]> {
  const { data } = await admin
    .from("professional_role_assignments")
    .select("professional_role_id")
    .eq("professional_id", professionalId)
    .eq("status", "active");
  return (data ?? []).map((r) => r.professional_role_id);
}

/**
 * Bring the professional's roles into line with the evidence on file. Called
 * after anything that can change eligibility — a document decision, a passed
 * assessment, a recorded register check.
 */
export async function recomputeRoleAssignments(
  admin: SupabaseClient<Database>,
  professionalId: string,
): Promise<void> {
  await admin.rpc("fn_recompute_role_assignments", { p_professional_id: professionalId });
}
