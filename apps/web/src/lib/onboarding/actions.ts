"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAuth } from "@/lib/auth/require-auth";
import { ensureProfessional } from "@/lib/onboarding/professional-session";
import { eligibilitySchema, profileSchema } from "@/lib/validation/onboarding";
import { eligibilityOutcome, type EligibilityOutcome } from "@/lib/compliance/requirements";
import { verifyUpload } from "@/lib/onboarding/upload-rules";

export type EligibilityResult = { ok: true; outcome: EligibilityOutcome } | { error: string } | null;

export async function submitEligibility(
  _prev: EligibilityResult,
  formData: FormData,
): Promise<EligibilityResult> {
  const user = await requireAuth();
  const parsed = eligibilitySchema.safeParse({
    employmentStatus: formData.get("employmentStatus"),
    trainingCurrent: formData.get("trainingCurrent") === "yes",
  });
  if (!parsed.success) return { error: "Please complete every field." };

  const professionalId = await ensureProfessional(user);
  if (!professionalId) return { error: "You must be signed in." };

  // Service client: ownership already verified via ensureProfessional (auth.uid's own row).
  // eligibility_screenings has admin-only RLS, so privileged server-side write is required.
  const admin = createServiceClient();
  const outcome = eligibilityOutcome(parsed.data.trainingCurrent);
  const { error } = await admin.from("eligibility_screenings").insert({
    professional_id: professionalId,
    employment_status: parsed.data.employmentStatus,
    training_current: parsed.data.trainingCurrent,
    outcome,
  });
  if (error) return { error: error.message };
  return { ok: true, outcome };
}

/**
 * The competency assessment must be PASSED before any application data
 * (profile or documents) can be submitted — spec: "Assessment must be passed
 * before application can be submitted/approved." Enforced server-side so the
 * wizard step order cannot be bypassed by navigating directly to a later step.
 */
async function assessmentPassed(
  admin: ReturnType<typeof createServiceClient>,
  professionalId: string,
): Promise<boolean> {
  const { count } = await admin
    .from("assessment_attempts")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", professionalId)
    .eq("passed", true);
  return (count ?? 0) > 0;
}

const ASSESSMENT_REQUIRED_ERROR =
  "You must pass the competency assessment before completing your application.";

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
      national_insurance_no: parsed.data.nationalInsuranceNo ?? null,
      professional_role_id: parsed.data.professionalRoleId,
      professional_summary: parsed.data.professionalSummary ?? null,
      travel_distance_km: parsed.data.travelDistanceKm ?? null,
      has_driving_licence: parsed.data.hasDrivingLicence ?? null,
      has_vehicle: parsed.data.hasVehicle ?? null,
      ...(photoPath ? { profile_photo_path: photoPath } : {}),
    })
    .eq("id", professionalId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function uploadDocument(
  formData: FormData,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireAuth();
  const professionalId = await ensureProfessional(user);
  if (!professionalId) return { error: "You must be signed in." };

  const admin0 = createServiceClient();
  if (!(await assessmentPassed(admin0, professionalId))) {
    return { error: ASSESSMENT_REQUIRED_ERROR };
  }

  const documentTypeId = String(formData.get("documentTypeId") ?? "");
  const file = formData.get("file");
  if (!documentTypeId) return { error: "Missing document type." };
  if (!(file instanceof File)) return { error: "Choose a file to upload." };

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
    expiry_date: (formData.get("expiryDate") as string) || null,
    uploaded_by: user.id,
  });
  if (error) return { error: error.message };
  return { ok: true };
}
