"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAuth } from "@/lib/auth/require-auth";
import { ensureProfessional } from "@/lib/onboarding/professional-session";
import { registerForRole, REFERENCE_LABEL } from "@/lib/compliance/regulated-roles";
import { isValidReference } from "@/lib/compliance/registration-verification";
import { recomputeRoleAssignments } from "./assignments";

export type RoleActionResult = { ok: true } | { error: string };

/**
 * Take on an additional role.
 *
 * The role is added as `pending` and nothing else changes: the professional then
 * sits that role's assessment and supplies whatever documents it needs that
 * their profile does not already have approved, and the existing document-review
 * path activates it. A professional cannot grant themselves an active role —
 * writes go through the service client, and the status is computed from evidence
 * by fn_recompute_role_assignments, never taken from the form.
 */
export async function addRole(_prev: RoleActionResult | null, formData: FormData): Promise<RoleActionResult> {
  const user = await requireAuth();
  const professionalId = await ensureProfessional(user);
  if (!professionalId) return { error: "You must be signed in." };

  const roleId = String(formData.get("professionalRoleId") ?? "").trim();
  const reference = String(formData.get("registrationReference") ?? "").trim();
  if (!roleId) return { error: "Choose a role to add." };

  const admin = createServiceClient();

  const { data: prof } = await admin
    .from("professionals")
    .select("country_code")
    .eq("id", professionalId)
    .single();

  const { data: role } = await admin
    .from("professional_roles")
    .select("id, name, country_code, is_active, registration_register")
    .eq("id", roleId)
    .maybeSingle();
  if (!role || !role.is_active) return { error: "That role is not available." };
  if (role.country_code !== (prof?.country_code ?? "GB")) {
    return { error: "That role belongs to another country." };
  }

  const { data: existing } = await admin
    .from("professional_role_assignments")
    .select("id, status")
    .eq("professional_id", professionalId)
    .eq("professional_role_id", roleId)
    .maybeSingle();
  if (existing && existing.status !== "withdrawn") {
    return { error: `You already hold the ${role.name} role.` };
  }

  // A regulated role is no use to anybody without its reference — and asking for
  // it here, rather than at approval time, means the person who can supply it is
  // the one being asked.
  const register = registerForRole(role);
  if (register) {
    if (!reference) return { error: `Enter your ${REFERENCE_LABEL[register]}.` };
    if (!isValidReference(register, reference)) {
      return { error: `That does not look like a valid ${REFERENCE_LABEL[register]}.` };
    }
  }

  if (existing) {
    const { error } = await admin
      .from("professional_role_assignments")
      .update({ status: "pending", registration_reference: register ? reference : null })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await admin.from("professional_role_assignments").insert({
      professional_id: professionalId,
      professional_role_id: roleId,
      status: "pending",
      registration_reference: register ? reference : null,
    });
    if (error) return { error: error.message };
  }

  // Everything this role needs may already be on file — a support worker adding
  // a second unregulated role they have already passed the assessment for, say.
  await recomputeRoleAssignments(admin, professionalId);

  await admin.from("audit_log").insert({
    actor_user_id: user.id,
    actor_type: "user",
    action: "professional.role_added",
    entity_type: "professional",
    entity_id: professionalId,
    summary: `Applied for the ${role.name} role`,
  });

  revalidatePath("/professional/roles");
  return { ok: true };
}

/**
 * Give a role up. Withdrawn rather than deleted: historic bookings, payouts and
 * audit entries still point at it, and the professional can apply again later.
 */
export async function withdrawRole(_prev: RoleActionResult | null, formData: FormData): Promise<RoleActionResult> {
  const user = await requireAuth();
  const professionalId = await ensureProfessional(user);
  if (!professionalId) return { error: "You must be signed in." };

  const roleId = String(formData.get("professionalRoleId") ?? "").trim();
  if (!roleId) return { error: "Choose a role to withdraw." };

  const admin = createServiceClient();

  const { data: assignment } = await admin
    .from("professional_role_assignments")
    .select("id, is_primary, professional_roles(name)")
    .eq("professional_id", professionalId)
    .eq("professional_role_id", roleId)
    .maybeSingle();
  if (!assignment) return { error: "You do not hold that role." };

  // The primary role is what the profile, the rate card and every historic
  // report resolve through. Giving it up is a change of career, not a checkbox.
  if (assignment.is_primary) {
    return { error: "Your main role cannot be withdrawn here — message us and we will help." };
  }

  // An accepted shift is a commitment to a client. Let them finish it.
  const { count } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("assigned_professional_id", professionalId)
    .eq("professional_role_id", roleId)
    .in("status", ["assigned", "accepted", "confirmed", "in_progress"]);
  if ((count ?? 0) > 0) {
    return { error: "You have upcoming bookings in this role. Complete or cancel them first." };
  }

  const { error } = await admin
    .from("professional_role_assignments")
    .update({ status: "withdrawn" })
    .eq("id", assignment.id);
  if (error) return { error: error.message };

  const roleName = (assignment.professional_roles as { name: string } | null)?.name ?? "role";
  await admin.from("audit_log").insert({
    actor_user_id: user.id,
    actor_type: "user",
    action: "professional.role_withdrawn",
    entity_type: "professional",
    entity_id: professionalId,
    summary: `Withdrew from the ${roleName} role`,
  });

  revalidatePath("/professional/roles");
  return { ok: true };
}
