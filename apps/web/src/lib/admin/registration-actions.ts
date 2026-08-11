"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { requireAuth } from "@/lib/auth/require-auth";
import { evaluateActivation } from "@/lib/compliance/activation";
import { sendNotification } from "@/lib/notifications/send";
import {
  registerForRole,
  REGISTER_LABEL,
  REFERENCE_LABEL,
} from "@/lib/compliance/regulated-roles";
import {
  isValidReference,
  normaliseReference,
  verificationValidUntil,
  type VerificationOutcome,
} from "@/lib/compliance/registration-verification";

export type RegistrationVerificationResult = { ok: true } | { error: string };

const OUTCOMES: VerificationOutcome[] = ["active", "not_found", "details_mismatch", "lapsed"];

/**
 * Record that an administrator checked a professional's registration against the
 * public register (client request, 7 Aug). Neither the NMC nor Ofsted publishes a
 * free API, so the lookup is human — what the platform guarantees is that it
 * happened, who did it, when, and that it goes stale after twelve months.
 *
 * Recording an `active` outcome re-evaluates activation, because for a regulated
 * role this may be the last thing standing between the professional and their
 * first booking.
 */
export async function recordRegistrationVerification(
  formData: FormData,
): Promise<RegistrationVerificationResult> {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };

  const professionalId = String(formData.get("professionalId") ?? "");
  const outcome = String(formData.get("outcome") ?? "") as VerificationOutcome;
  const reference = normaliseReference(String(formData.get("reference") ?? ""));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const confirmedActive = formData.get("confirmActive") === "on";
  const confirmedIdentity = formData.get("confirmIdentity") === "on";

  if (!professionalId) return { error: "Missing professional." };
  if (!OUTCOMES.includes(outcome)) return { error: "Choose what the register showed." };

  const admin = createServiceClient();
  const { data: professional } = await admin
    .from("professionals")
    .select("id, user_id, professional_status, professional_roles(code, registration_register)")
    .eq("id", professionalId)
    .maybeSingle();
  if (!professional) return { error: "Professional not found." };

  const register = registerForRole(
    professional.professional_roles as { registration_register: string | null } | null,
  );
  if (!register) return { error: "This role does not require a register check." };

  if (!reference) return { error: `Enter the ${REFERENCE_LABEL[register]} you checked.` };
  if (!isValidReference(register, reference)) {
    return { error: `That does not look like a valid ${REFERENCE_LABEL[register]}.` };
  }

  // Both confirmations are required to record a pass: an active registration
  // belonging to somebody else is not a pass.
  if (outcome === "active" && !(confirmedActive && confirmedIdentity)) {
    return {
      error:
        "Confirm both that the registration is active and that the details match the applicant.",
    };
  }

  const { error } = await admin.from("registration_verifications").insert({
    professional_id: professionalId,
    register,
    reference,
    outcome,
    checked_by: adminId,
    valid_until: verificationValidUntil(),
    notes,
  });
  if (error) return { error: error.message };

  await admin.from("audit_log").insert({
    actor_user_id: adminId,
    actor_type: "admin",
    action: "registration.verified",
    entity_type: "professional",
    entity_id: professionalId,
    summary: `${REGISTER_LABEL[register]} checked (${reference}): ${outcome.replace(/_/g, " ")}`,
  });

  if (outcome !== "active") return { ok: true };

  // The check may have been the last outstanding item. Mirror the document
  // review: activate only from a compliance-blocked status, never from a
  // punitive one (suspended, under investigation, rejected, removed).
  const { activate } = await evaluateActivation(admin, professionalId);
  const blocked = ["pending_verification", "booking_restricted", "compliance_hold"];
  if (activate && blocked.includes(professional.professional_status)) {
    await admin
      .from("professionals")
      .update({ compliance_status: "approved", professional_status: "active" })
      .eq("id", professionalId);

    await Promise.all([
      admin.from("professional_status_actions").insert({
        professional_id: professionalId,
        action_type: "reinstate",
        resulting_status: "active",
        reason_text: `${REGISTER_LABEL[register]} verified and all compliance requirements met`,
        applied_by: adminId,
      }),
      admin.from("audit_log").insert({
        actor_user_id: adminId,
        actor_type: "admin",
        action: "professional.activated",
        entity_type: "professional",
        entity_id: professionalId,
        summary: "Registration verified — professional activated",
      }),
      ...(professional.user_id
        ? [
            sendNotification("compliance_approval", professional.user_id, {
              professional_id: professionalId,
            }),
          ]
        : []),
    ]);
  }

  return { ok: true };
}
