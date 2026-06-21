import Link from "next/link";
import { Suspense } from "react";
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

  const [{ data: pros }, { data: reqs }] = await Promise.all([
    admin.from("professionals").select("id, professional_role_id"),
    admin
      .from("compliance_requirements")
      .select("professional_role_id, document_type_id, document_types(is_compliance_critical)"),
  ]);

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

  const compliantIds: string[] = [];
  for (const prof of pros ?? []) {
    if (!prof.professional_role_id) continue;
    const required = criticalReqsByRole.get(prof.professional_role_id) ?? [];
    const approved = validDocsByProf.get(prof.id) ?? new Set<string>();
    if (isCompliant(required, approved)) compliantIds.push(prof.id);
  }
  return compliantIds;
}

async function lookupUserIdsByEmail(admin: ServiceClient, text: string): Promise<string[]> {
  const { data } = await admin.from("users").select("id").ilike("email", `%${text}%`);
  return (data ?? []).map((user) => user.id);
}

async function allProfessionalIds(admin: ServiceClient): Promise<string[]> {
  const { data } = await admin.from("professionals").select("id");
  return (data ?? []).map((p) => p.id);
}

/** Professionals whose ROLE requires a document of the given type code. Used to
 *  scope the "invalid" (missing/expired) filter so professionals for whom the
 *  document is not required are not mislabelled as non-compliant. */
async function professionalsRequiringDoc(admin: ServiceClient, code: string): Promise<Set<string>> {
  const { data: docType } = await admin.from("document_types").select("id").eq("code", code).maybeSingle();
  if (!docType) return new Set();
  const { data: reqs } = await admin
    .from("compliance_requirements")
    .select("professional_role_id")
    .eq("document_type_id", docType.id);
  const roleIds = new Set((reqs ?? []).map((r) => r.professional_role_id));
  if (roleIds.size === 0) return new Set();
  const { data: pros } = await admin.from("professionals").select("id, professional_role_id");
  const set = new Set<string>();
  for (const p of pros ?? []) {
    if (p.professional_role_id && roleIds.has(p.professional_role_id)) set.add(p.id);
  }
  return set;
}

/** Professionals holding an approved, unexpired document of the given type code. */
async function professionalsWithValidDoc(admin: ServiceClient, code: string): Promise<Set<string>> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: docType } = await admin.from("document_types").select("id").eq("code", code).maybeSingle();
  if (!docType) return new Set();
  const { data: docs } = await admin
    .from("documents")
    .select("professional_id, expiry_date")
    .eq("document_type_id", docType.id)
    .eq("verification_status", "approved");
  const set = new Set<string>();
  for (const d of docs ?? []) {
    if (d.expiry_date && d.expiry_date < today) continue;
    set.add(d.professional_id);
  }
  return set;
}

async function professionalsWhoPassedAssessment(admin: ServiceClient): Promise<Set<string>> {
  const { data } = await admin.from("assessment_attempts").select("professional_id").eq("passed", true);
  return new Set((data ?? []).map((a) => a.professional_id));
}

/** Professionals who stated availability on the given weekday (0 = Monday … 6 = Sunday). */
async function professionalsAvailableOnDay(admin: ServiceClient, day: number): Promise<Set<string>> {
  const { data } = await admin
    .from("professional_availability")
    .select("professional_id")
    .eq("day_of_week", day);
  return new Set((data ?? []).map((r) => r.professional_id));
}

/** PostgREST reserved characters that would break an `.or()` filter string. */
function sanitiseOrValue(text: string): string {
  return text.replace(/[,()*\\]/g, " ");
}

async function fetchProfessionals(
  admin: ServiceClient,
  filters: ReturnType<typeof buildProfessionalFilters>,
): Promise<ProfessionalRow[]> {
  // Each id-based filter contributes a set of matching professional ids; the
  // final id filter is their intersection.
  const constraints: Set<string>[] = [];
  // The assessment "not passed" set is the complement against ALL professionals
  // (everyone is in scope for the assessment). DBS/registration "invalid" is the
  // complement only among professionals whose ROLE requires that document.
  const allIds = filters.assessmentStatus === "not_passed" ? await allProfessionalIds(admin) : [];

  if (filters.requireValidDocs) {
    constraints.push(new Set(await getProfessionalsWithValidDocs(admin)));
  }
  if (filters.dbsStatus) {
    const valid = await professionalsWithValidDoc(admin, "enhanced_dbs");
    if (filters.dbsStatus === "valid") {
      constraints.push(valid);
    } else {
      const required = await professionalsRequiringDoc(admin, "enhanced_dbs");
      constraints.push(new Set([...required].filter((id) => !valid.has(id))));
    }
  }
  if (filters.registrationStatus) {
    const valid = await professionalsWithValidDoc(admin, "professional_registration");
    if (filters.registrationStatus === "valid") {
      constraints.push(valid);
    } else {
      const required = await professionalsRequiringDoc(admin, "professional_registration");
      constraints.push(new Set([...required].filter((id) => !valid.has(id))));
    }
  }
  if (filters.assessmentStatus) {
    const passed = await professionalsWhoPassedAssessment(admin);
    constraints.push(
      filters.assessmentStatus === "passed" ? passed : new Set(allIds.filter((id) => !passed.has(id))),
    );
  }
  if (filters.availabilityDay !== undefined) {
    constraints.push(await professionalsAvailableOnDay(admin, filters.availabilityDay));
  }

  let idFilter: string[] | null = null;
  if (constraints.length > 0) {
    let intersection = constraints[0];
    for (let i = 1; i < constraints.length; i++) {
      intersection = new Set([...intersection].filter((id) => constraints[i].has(id)));
    }
    idFilter = [...intersection];
    if (idFilter.length === 0) return [];
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
  if (filters.minTravelKm !== undefined) {
    query = query.gte("travel_distance_km", filters.minTravelKm);
  }
  if (filters.text) {
    // Sanitise before embedding in the PostgREST `.or()` grammar so commas /
    // parentheses in the search text cannot break or inject filter clauses.
    const pattern = `%${sanitiseOrValue(filters.text)}%`;
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
    minTravelKm: pick("minTravelKm"),
    requireValidDocs: pick("requireValidDocs") === "true",
    dbsStatus: pick("dbsStatus"),
    registrationStatus: pick("registrationStatus"),
    assessmentStatus: pick("assessmentStatus"),
    availabilityDay: pick("availabilityDay"),
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
      <p className="mt-2 text-sm text-[#4a4a4a]">
        Search and filter professionals by status, location and compliance.
      </p>

      <Suspense fallback={<div className="mt-6 h-32 animate-pulse rounded-2xl bg-[#f5f7f6]" />}>
        <UserFilters roles={roles ?? []} />
      </Suspense>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#4a4a4a]">
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
                    className="text-[#2e7d32] hover:underline"
                  >
                    {prof.full_name}
                  </Link>
                </td>
                <td className="p-3">{prof.users?.email ?? "—"}</td>
                <td className="p-3">{prof.professional_roles?.name ?? "—"}</td>
                <td className="p-3">
                  <span className="rounded-full bg-[#f5f7f6] px-2.5 py-0.5 text-xs font-medium text-[#4a4a4a]">
                    {formatLabel(prof.professional_status)}
                  </span>
                </td>
                <td className="p-3">
                  <span className="rounded-full bg-[#f5f7f6] px-2.5 py-0.5 text-xs font-medium text-[#4a4a4a]">
                    {formatLabel(prof.compliance_status)}
                  </span>
                </td>
                <td className="p-3">
                  <span className="rounded-full bg-[#f5f7f6] px-2.5 py-0.5 text-xs font-medium text-[#4a4a4a]">
                    {prof.users?.account_status ? formatLabel(prof.users.account_status) : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {professionals.length === 0 && (
          <p className="p-6 text-sm text-[#4a4a4a]">No professionals match these filters.</p>
        )}
      </div>
    </main>
  );
}
