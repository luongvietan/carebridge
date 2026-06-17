"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAuth } from "@/lib/auth/require-auth";
import { ensureProfessional } from "@/lib/onboarding/professional-session";
import { eligibilitySchema, profileSchema, mandatoryTrainingItems } from "@/lib/validation/onboarding";
import { eligibilityOutcome, type EligibilityOutcome } from "@/lib/compliance/requirements";
import { verifyUpload } from "@/lib/onboarding/upload-rules";
import { validateDocumentExpiry } from "@/lib/onboarding/document-expiry";
import { parseSkillIds, parseAvailabilityDays } from "@/lib/onboarding/profile-children";
import { eligibilityCompleted, assessmentPassed } from "@/lib/onboarding/progress";

export type EligibilityResult = { ok: true; outcome: EligibilityOutcome } | { error: string } | null;

export async function submitEligibility(
  _prev: EligibilityResult,
  formData: FormData,
): Promise<EligibilityResult> {
  const user = await requireAuth();
  // Per-item attestation: an unchecked box means that training is not current.
  const trainingItems: Record<string, boolean> = {};
  for (const item of mandatoryTrainingItems) {
    trainingItems[item.key] = formData.get(`training_${item.key}`) === "on";
  }
  const parsed = eligibilitySchema.safeParse({
    employmentStatus: formData.get("employmentStatus"),
    trainingItems,
  });
  if (!parsed.success) return { error: "Please complete every field." };

  const professionalId = await ensureProfessional(user);
  if (!professionalId) return { error: "You must be signed in." };

  // training_current is true only when every mandatory item is attested current.
  const allCurrent = mandatoryTrainingItems.every((i) => parsed.data.trainingItems[i.key]);

  // Service client: ownership already verified via ensureProfessional (auth.uid's own row).
  // eligibility_screenings has admin-only RLS, so privileged server-side write is required.
  const admin = createServiceClient();
  const outcome = eligibilityOutcome(allCurrent);
  const { error } = await admin.from("eligibility_screenings").insert({
    professional_id: professionalId,
    employment_status: parsed.data.employmentStatus,
    training_current: allCurrent,
    training_attestations: parsed.data.trainingItems,
    outcome,
  });
  if (error) return { error: error.message };

  // Mirror the employment status onto the professional row so it is queryable,
  // exportable and visible in the admin dashboard (eligibility_screenings is
  // admin-RLS only). Best-effort: the screening row above is the source of truth.
  await admin
    .from("professionals")
    .update({ employment_status: parsed.data.employmentStatus })
    .eq("id", professionalId);

  return { ok: true, outcome };
}

// Server-side ordering guards (spec §1–2): eligibility must be screened and the
// competency assessment passed before any application data is written. Shared
// with the page-level guard (onboarding/guard.ts) via onboarding/progress.ts so
// the wizard order cannot be bypassed by navigating directly to a later step.
const ASSESSMENT_REQUIRED_ERROR =
  "You must pass the competency assessment before completing your application.";

const ELIGIBILITY_REQUIRED_ERROR =
  "Please complete the eligibility screening before continuing your application.";

export type ProfileResult = { ok: true } | { error: string } | null;

export async function saveProfile(_prev: ProfileResult, formData: FormData): Promise<ProfileResult> {
  const user = await requireAuth();
  const parsed = profileSchema.safeParse({
    dateOfBirth: (formData.get("dateOfBirth") as string) || undefined,
    addressLine1: formData.get("addressLine1"),
    addressLine2: (formData.get("addressLine2") as string) || undefined,
    city: formData.get("city"),
    postcode: formData.get("postcode"),
    nationalInsuranceNo: (formData.get("nationalInsuranceNo") as string) || undefined,
    professionalRoleId: formData.get("professionalRoleId"),
    professionalSummary: (formData.get("professionalSummary") as string) || undefined,
    travelDistanceKm: (formData.get("travelDistanceKm") as string) || undefined,
    hasDrivingLicence: formData.get("hasDrivingLicence") === "on",
    hasVehicle: formData.get("hasVehicle") === "on",
  });
  if (!parsed.success) return { error: "Please complete the required fields." };

  const professionalId = await ensureProfessional(user);
  if (!professionalId) return { error: "You must be signed in." };

  const gateAdmin = createServiceClient();
  if (!(await eligibilityCompleted(gateAdmin, professionalId))) {
    return { error: ELIGIBILITY_REQUIRED_ERROR };
  }
  if (!(await assessmentPassed(gateAdmin, professionalId))) {
    return { error: ASSESSMENT_REQUIRED_ERROR };
  }

  // Optional profile photo → private storage bucket.
  let photoPath: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const verified = await verifyUpload(photo);
    if (!verified.ok) return { error: verified.error };
    const admin = createServiceClient();
    photoPath = `${professionalId}/profile/${crypto.randomUUID()}-${verified.safeName}`;
    const { error: upErr } = await admin.storage.from("documents").upload(photoPath, photo, {
      contentType: verified.safeMime,
      upsert: true,
    });
    if (upErr) return { error: `Photo upload failed: ${upErr.message}` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("professionals")
    .update({
      date_of_birth: parsed.data.dateOfBirth ?? null,
      address_line1: parsed.data.addressLine1,
      address_line2: parsed.data.addressLine2 ?? null,
      city: parsed.data.city,
      postcode: parsed.data.postcode,
      national_insurance_no: parsed.data.nationalInsuranceNo
        ? parsed.data.nationalInsuranceNo.replace(/\s/g, "").toUpperCase()
        : null,
      professional_role_id: parsed.data.professionalRoleId,
      professional_summary: parsed.data.professionalSummary ?? null,
      travel_distance_km: parsed.data.travelDistanceKm ?? null,
      has_driving_licence: parsed.data.hasDrivingLicence ?? null,
      has_vehicle: parsed.data.hasVehicle ?? null,
      ...(photoPath ? { profile_photo_path: photoPath } : {}),
    })
    .eq("id", professionalId);
  if (error) return { error: error.message };

  // Persist skills/specialities and weekly availability as a replace-set. Owner
  // self-RLS (0042) authorises these writes for the professional's own rows.
  const skillIds = parseSkillIds(formData.getAll("skillIds").map(String));
  await supabase.from("professional_skills").delete().eq("professional_id", professionalId);
  if (skillIds.length > 0) {
    await supabase
      .from("professional_skills")
      .insert(skillIds.map((skill_id) => ({ professional_id: professionalId, skill_id })));
  }

  const availabilityDays = parseAvailabilityDays(formData.getAll("availabilityDays").map(String));
  await supabase.from("professional_availability").delete().eq("professional_id", professionalId);
  if (availabilityDays.length > 0) {
    await supabase
      .from("professional_availability")
      .insert(
        availabilityDays.map((day_of_week) => ({ professional_id: professionalId, day_of_week })),
      );
  }

  return { ok: true };
}

export async function uploadDocument(
  formData: FormData,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireAuth();
  const professionalId = await ensureProfessional(user);
  if (!professionalId) return { error: "You must be signed in." };

  const admin0 = createServiceClient();
  if (!(await eligibilityCompleted(admin0, professionalId))) {
    return { error: ELIGIBILITY_REQUIRED_ERROR };
  }
  if (!(await assessmentPassed(admin0, professionalId))) {
    return { error: ASSESSMENT_REQUIRED_ERROR };
  }

  const documentTypeId = String(formData.get("documentTypeId") ?? "");
  const file = formData.get("file");
  if (!documentTypeId) return { error: "Missing document type." };
  if (!(file instanceof File)) return { error: "Choose a file to upload." };

  // Documents whose type carries an expiry (DBS, registration, insurance,
  // training certificates …) must be uploaded with a valid, in-date expiry —
  // otherwise the daily compliance sweep (which only acts on rows with a
  // non-null expiry_date) can never expire or alert on a lapsed certificate.
  const { data: docType } = await admin0
    .from("document_types")
    .select("has_expiry")
    .eq("id", documentTypeId)
    .maybeSingle();
  if (!docType) return { error: "Unknown document type." };
  const expiryRaw = (formData.get("expiryDate") as string) || "";
  const expiryCheck = validateDocumentExpiry({
    hasExpiry: docType.has_expiry,
    expiryDate: expiryRaw,
  });
  if (!expiryCheck.ok) return { error: expiryCheck.error };

  const verified = await verifyUpload(file);
  if (!verified.ok) return { error: verified.error };

  const admin = createServiceClient();
  const path = `${professionalId}/${documentTypeId}/${crypto.randomUUID()}-${verified.safeName}`;
  const { error: upErr } = await admin.storage
    .from("documents")
    .upload(path, file, { contentType: verified.safeMime, upsert: true });
  if (upErr) return { error: `Upload failed: ${upErr.message}` };

  const { error } = await admin.from("documents").insert({
    professional_id: professionalId,
    document_type_id: documentTypeId,
    storage_path: path,
    original_filename: verified.safeName,
    reference_number: (formData.get("referenceNumber") as string) || null,
    issuing_body: (formData.get("issuingBody") as string) || null,
    expiry_date: expiryRaw || null,
    uploaded_by: user.id,
  });
  if (error) return { error: error.message };
  return { ok: true };
}
