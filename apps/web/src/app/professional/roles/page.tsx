import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { loadRoleAssignments } from "@/lib/roles/assignments";
import { registerForRole } from "@/lib/compliance/regulated-roles";
import { RoleManager, type AddableRole, type RoleCard } from "@/components/role-manager";

export const dynamic = "force-dynamic";

export default async function ProfessionalRolesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: prof } = user
    ? await supabase
        .from("professionals")
        .select("id, country_code")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  if (!prof) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">Your roles</h1>
        <p className="mt-4 text-sm text-[#4a4a4a]">Sign in to manage the roles you work in.</p>
      </main>
    );
  }

  const admin = createServiceClient();
  const assignments = await loadRoleAssignments(admin, prof.id);

  // Only roles offered in the professional's own country: a UK carer is not
  // offered the Portuguese register, and vice versa.
  const { data: allRoles } = await admin
    .from("professional_roles")
    .select("id, name, registration_register, country_code, is_active")
    .eq("is_active", true)
    .eq("country_code", prof.country_code ?? "GB")
    .order("name");

  const held = new Set(
    assignments.filter((a) => a.status !== "withdrawn").map((a) => a.roleId),
  );
  const addable: AddableRole[] = (allRoles ?? [])
    .filter((r) => !held.has(r.id))
    .map((r) => ({ id: r.id, name: r.name, register: registerForRole(r) }));

  const cards: RoleCard[] = assignments
    .filter((a) => a.status !== "withdrawn")
    .map((a) => ({
      roleId: a.roleId,
      roleName: a.roleName,
      status: a.status,
      isPrimary: a.isPrimary,
      assessmentLockedUntil: a.assessmentLockedUntil,
      gaps: a.gaps,
    }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Your roles</h1>
      <p className="mt-2 text-sm text-[#4a4a4a]">
        You can work in more than one role. Each is cleared separately — its own assessment, and
        whichever documents and registrations that role requires — so one waiting on paperwork never
        holds up another.
      </p>

      <RoleManager roles={cards} addable={addable} />
    </main>
  );
}
