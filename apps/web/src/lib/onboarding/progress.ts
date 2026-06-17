import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Admin = SupabaseClient<Database>;

/** Eligibility screening is the first mandatory step (spec §1). */
export async function eligibilityCompleted(admin: Admin, professionalId: string): Promise<boolean> {
  const { count } = await admin
    .from("eligibility_screenings")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", professionalId);
  return (count ?? 0) > 0;
}

/** The competency assessment must be PASSED before the registration form (spec §2). */
export async function assessmentPassed(admin: Admin, professionalId: string): Promise<boolean> {
  const { count } = await admin
    .from("assessment_attempts")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", professionalId)
    .eq("passed", true);
  return (count ?? 0) > 0;
}

/** The profile is "complete enough" to choose required documents once a role is set. */
export async function profileComplete(admin: Admin, professionalId: string): Promise<boolean> {
  const { data } = await admin
    .from("professionals")
    .select("professional_role_id")
    .eq("id", professionalId)
    .maybeSingle();
  return Boolean(data?.professional_role_id);
}
