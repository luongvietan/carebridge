import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { guardOnboardingStep } from "@/lib/onboarding/guard";

export default async function ProfilePage() {
  await guardOnboardingStep("profile");
  const supabase = await createClient();
  const [{ data: roles }, { data: skills }, { data: { user } }] = await Promise.all([
    supabase.from("professional_roles").select("id, name").eq("is_active", true).order("name"),
    supabase.from("skills").select("id, name").eq("is_active", true).order("name"),
    supabase.auth.getUser(),
  ]);

  const { data: current } = user
    ? await supabase
        .from("professionals")
        .select(
          "id, full_name, professional_role_id, date_of_birth, address_line1, address_line2, city, postcode, national_insurance_no, professional_summary, registration_body, registration_number, travel_distance_km, has_driving_licence, has_vehicle, profile_photo_path",
        )
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  // Sign a short-lived URL so the professional can see the photo already on
  // record (the bucket is private) and know whether they need to replace it.
  const currentPhotoUrl = current?.profile_photo_path
    ? ((
        await supabase.storage
          .from("documents")
          .createSignedUrl(current.profile_photo_path, 600)
      ).data?.signedUrl ?? null)
    : null;

  const [{ data: currentSkills }, { data: currentAvailability }] = current
    ? await Promise.all([
        supabase.from("professional_skills").select("skill_id").eq("professional_id", current.id),
        supabase
          .from("professional_availability")
          .select("day_of_week")
          .eq("professional_id", current.id),
      ])
    : [{ data: null }, { data: null }];

  return (
    <ProfileForm
      roles={roles ?? []}
      skills={skills ?? []}
      current={current}
      currentSkillIds={(currentSkills ?? []).map((s) => s.skill_id)}
      currentAvailabilityDays={(currentAvailability ?? [])
        .map((a) => a.day_of_week)
        .filter((d): d is number => d != null)}
      currentPhotoUrl={currentPhotoUrl}
    />
  );
}
