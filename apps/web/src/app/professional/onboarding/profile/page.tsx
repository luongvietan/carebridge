import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: roles } = await supabase
    .from("professional_roles")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: current } = user
    ? await supabase
        .from("professionals")
        .select(
          "professional_role_id, date_of_birth, address_line1, address_line2, city, postcode, national_insurance_no, professional_summary, travel_distance_km, has_driving_licence, has_vehicle",
        )
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  return <ProfileForm roles={roles ?? []} current={current} />;
}
