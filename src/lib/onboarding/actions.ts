"use server";
import { createClient } from "@/lib/supabase/server";
import { eligibilitySchema } from "@/lib/validation/onboarding";
import { eligibilityOutcome, type EligibilityOutcome } from "@/lib/compliance/requirements";

/**
 * Ensure a professionals row exists for the signed-in user and return its id.
 * Onboarding steps (eligibility, assessment, documents) all reference it, so it
 * is created lazily on first onboarding action rather than via the signup trigger
 * (which would collide with existing DB test fixtures).
 */
export async function ensureProfessional(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return existing.id;

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Professional";
  const { data: created } = await supabase
    .from("professionals")
    .insert({ user_id: user.id, full_name: fullName })
    .select("id")
    .single();
  return created?.id ?? null;
}

export type EligibilityResult = { ok: true; outcome: EligibilityOutcome } | { error: string } | null;

export async function submitEligibility(
  _prev: EligibilityResult,
  formData: FormData,
): Promise<EligibilityResult> {
  const parsed = eligibilitySchema.safeParse({
    employmentStatus: formData.get("employmentStatus"),
    trainingCurrent: formData.get("trainingCurrent") === "yes",
  });
  if (!parsed.success) return { error: "Please complete every field." };

  const professionalId = await ensureProfessional();
  if (!professionalId) return { error: "You must be signed in." };

  const supabase = await createClient();
  const outcome = eligibilityOutcome(parsed.data.trainingCurrent);
  const { error } = await supabase.from("eligibility_screenings").insert({
    professional_id: professionalId,
    employment_status: parsed.data.employmentStatus,
    training_current: parsed.data.trainingCurrent,
    outcome,
  });
  if (error) return { error: error.message };
  return { ok: true, outcome };
}
