import Link from "next/link";
import { redirect } from "next/navigation";
import { UserFilters } from "@/components/user-filters";
import { requireAdmin } from "@/lib/auth/admin";
import {
  buildProfessionalFilters,
  type ProfessionalFilterCriteria,
} from "@/lib/admin/search";
import { isCompliant } from "@/lib/compliance/requirements";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type ServiceClient = SupabaseClient<Database>;

type ProfessionalRow = {
  id: string;
  full_name: string;
  professional_status: string;
  compliance_status: string;
  professional_roles: { name: string } | null;
  users: { email: string; account_status: string } | null;
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

/** Professionals with all role-critical docs approved and not expired. */
async function getProfessionalsWithValidDocs(admin: ServiceClient): Promise<string[]> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: pros } = await admin.from("professionals").select("id, professional_role_id");

  const { data: reqs } = await admin
    .from("compliance_requirements")
    .select("professional_role_id, document_type_id, document_types(is_compliance_critical)");

  const criticalReqsByRole = new Map<string, string[]>();
  for (const req of reqs ?? []) {
    const critical = (
      req.document_types as { is_compliance_critical: boolean } | null
    )?.is_compliance_critical;
    if (!critical || !req.professional_role_id) continue;
    const list = criticalReqsByRole.get(req.professional_role_id) ?? [];
    list.push(req.document_type_id);
    criticalReqsByRole.set(req.professional_role_id, list);
  }

  const { data: docs } = await admin
    .from("documents")
    .select("professional_id, document_type_id, expiry_date")
    .eq("verification_status", "approved");

  const validDocsByProf = new Map<string, Set<string>>();
  for (const doc of docs ?? []) {
    if (doc.expiry_date && doc.expiry_date < today) continue;
    const set = validDocsByProf.get(doc.professional_id) ?? new Set<string>();
    set.add(doc.document_type_id);
    validDocsByProf.set(doc.professional_id, set);
  }

  return (pros ?? [])
    .filter((prof) => {
      if (!prof.professional_role_id) return false;
      const required = criticalReqsByRole.get(prof.professional_role_id) ?? [];
      const approved = validDocsByProf.get(prof.id) ?? new Set<string>();
      return isCompliant(required, approved);
    })
    .map((prof) => prof.id);
}

async function lookupUserIdsByEmail(admin: ServiceClient, text: string): Promise<string[]> {
  const { data } = await admin.from("users").select("id").ilike("email", `%${text}%`);
  return (data ?? []).map((user) => user.id);
}

async function fetchProfessionals(
  admin: ServiceClient,
  filters: ReturnType<typeof buildProfessionalFilters>,
): Promise<ProfessionalRow[]> {
  let idFilter: string[] | null = null;

  if (filters.requireValidDocs) {
    idFilter = await getProfessionalsWithValidDocs(admin);
  }

  if (idFilter !== null && idFilter.length === 0) {
    return [];
  }

  let emailUserIds: string[] = [];
  if (filters.text) {
    emailUserIds = await lookupUserIdsByEmail(admin, filters.text);
  }

  let query = admin
    .from("professionals")
    .select(
      "id, full_name, professional_status, compliance_status, professional_role_id, postcode, travel_distance_km, professional_roles(name), users:user_id(email, account_status)",
    )
    .order("full_name", { ascending: true });

  if (idFilter !== null) {
    query = query.in("id", idFilter);
  }
  if (filters.professionalStatus) {
    query = query.eq(
      "professional_status",
      filters.professionalStatus as Database["public"]["Enums"]["professional_status"],
    );
  }
  if (filters.complianceStatus) {
    query = query.eq(
      "compliance_status",
      filters.complianceStatus as Database["public"]["Enums"]["compliance_status"],
    );
  }
  if (filters.roleId) {
    query = query.eq("professional_role_id", filters.roleId);
  }
  if (filters.postcode) {
    query = query.ilike("postcode", `${filters.postcode}%`);
  }
  if (filters.maxTravelKm !== undefined) {
    query = query.gte("travel_distance_km", filters.maxTravelKm);
  }
  if (filters.text) {
    const pattern = `%${filters.text}%`;
    if (emailUserIds.length > 0) {
      query = query.or(`full_name.ilike.${pattern},user_id.in.(${emailUserIds.join(",")})`);
    } else {
      query = query.ilike("full_name", pattern);
    }
  }

  const { data } = await query;
  return (data ?? []) as ProfessionalRow[];
}

function criteriaFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): ProfessionalFilterCriteria {
  const pick = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : undefined;
  };
  return {
    text: pick("text"),
    professionalStatus: pick("professionalStatus"),
    complianceStatus: pick("complianceStatus"),
    roleId: pick("roleId"),
    postcode: pick("postcode"),
    maxTravelKm: pick("maxTravelKm"),
    requireValidDocs: pick("requireValidDocs") === "true",
  };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await requireAdmin())) redirect("/login");

  const params = await searchParams;
  const filters = buildProfessionalFilters(criteriaFromSearchParams(params));
  const admin = createServiceClient();

  const [{ data: roles }, professionals] = await Promise.all([
    admin.from("professional_roles").select("id, name").eq("is_active", true).order("name"),
    fetchProfessionals(admin, filters),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Professionals</h1>
      <p className="mt-2 text-sm text-[#5b6a62]">
        Search and filter professionals by status, location and compliance.
      </p>

      <UserFilters roles={roles ?? []} />

      <div className="mt-8 overflow-x-auto border border-[#dbe7e0]">
        <table className="w-full text-sm">
          <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Professional status</th>
              <th className="p-3 font-medium">Compliance</th>
              <th className="p-3 font-medium">Account</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dbe7e0]">
            {professionals.map((prof) => (
              <tr key={prof.id}>
                <td className="p-3">
                  <Link
                    href={`/admin/users/${prof.id}`}
                    className="text-[#198038] hover:underline"
                  >
                    {prof.full_name}
                  </Link>
                </td>
                <td className="p-3">{prof.users?.email ?? "—"}</td>
                <td className="p-3">{prof.professional_roles?.name ?? "—"}</td>
                <td className="p-3">
                  <span className="bg-[#f5f7f6] px-2 py-0.5 text-xs text-[#5b6a62]">
                    {formatLabel(prof.professional_status)}
                  </span>
                </td>
                <td className="p-3">
                  <span className="bg-[#f5f7f6] px-2 py-0.5 text-xs text-[#5b6a62]">
                    {formatLabel(prof.compliance_status)}
                  </span>
                </td>
                <td className="p-3">
                  <span className="bg-[#f5f7f6] px-2 py-0.5 text-xs text-[#5b6a62]">
                    {prof.users?.account_status ? formatLabel(prof.users.account_status) : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {professionals.length === 0 && (
          <p className="p-6 text-sm text-[#5b6a62]">No professionals match these filters.</p>
        )}
      </div>
    </main>
  );
}
