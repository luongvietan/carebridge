import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AccountStatusControl } from "@/components/account-status-control";
import { StatusActionForm } from "@/components/status-action-form";
import { requireAdmin } from "@/lib/auth/admin";
import type { AccountStatus } from "@/lib/admin/account-status";
import type { ProfessionalStatus } from "@/lib/admin/status-machine";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireAdmin())) redirect("/login");

  const { id } = await params;
  const admin = createServiceClient();

  const { data: professional } = await admin
    .from("professionals")
    .select(
      "id, full_name, professional_status, compliance_status, professional_role_id, user_id, professional_roles(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!professional) notFound();

  const [{ data: user }, { data: history }] = await Promise.all([
    admin
      .from("users")
      .select("email, account_status")
      .eq("id", professional.user_id)
      .maybeSingle(),
    admin
      .from("professional_status_actions")
      .select("action_type, reason_code, resulting_status, applied_at")
      .eq("professional_id", id)
      .order("applied_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm tracking-wide text-[#525252] uppercase">Admin</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="text-3xl font-light">{professional.full_name}</h1>
        <Link href="/admin/users" className="text-sm text-[#198038] hover:underline">
          ← Back to list
        </Link>
      </div>

      <section className="mt-8 border border-[#e0e0e0] p-4 text-sm">
        <h2 className="text-lg font-light">Profile</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[#8c8c8c]">Email</dt>
            <dd>{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[#8c8c8c]">Role</dt>
            <dd>{(professional.professional_roles as { name: string } | null)?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[#8c8c8c]">Professional status</dt>
            <dd>{formatLabel(professional.professional_status)}</dd>
          </div>
          <div>
            <dt className="text-[#8c8c8c]">Compliance status</dt>
            <dd>{formatLabel(professional.compliance_status)}</dd>
          </div>
          <div>
            <dt className="text-[#8c8c8c]">Account status</dt>
            <dd>{user?.account_status ? formatLabel(user.account_status) : "—"}</dd>
          </div>
        </dl>
        <p className="mt-4">
          <Link href="/admin/compliance" className="text-[#198038] hover:underline">
            View compliance documents →
          </Link>
        </p>
      </section>

      <section className="mt-10 border border-[#e0e0e0] p-4">
        <h2 className="text-lg font-light">Professional status action</h2>
        <div className="mt-4">
          <StatusActionForm
            professionalId={professional.id}
            currentStatus={professional.professional_status as ProfessionalStatus}
          />
        </div>
      </section>

      {user?.account_status && (
        <section className="mt-10 border border-[#e0e0e0] p-4">
          <h2 className="text-lg font-light">Account access</h2>
          <div className="mt-4">
            <AccountStatusControl
              userId={professional.user_id}
              current={user.account_status as AccountStatus}
            />
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-light">Status action history</h2>
        <div className="mt-4 overflow-x-auto border border-[#e0e0e0]">
          <table className="w-full text-sm">
            <thead className="border-b border-[#e0e0e0] bg-[#f4f4f4] text-left">
              <tr>
                <th className="p-3 font-medium">Applied</th>
                <th className="p-3 font-medium">Action</th>
                <th className="p-3 font-medium">Reason</th>
                <th className="p-3 font-medium">Resulting status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {(history ?? []).map((row, index) => (
                <tr key={`${row.applied_at}-${index}`}>
                  <td className="p-3 whitespace-nowrap">{formatDateTime(row.applied_at)}</td>
                  <td className="p-3">{formatLabel(row.action_type)}</td>
                  <td className="p-3">
                    {row.reason_code ? formatLabel(row.reason_code) : "—"}
                  </td>
                  <td className="p-3">
                    {row.resulting_status ? formatLabel(row.resulting_status) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(history ?? []).length === 0 && (
            <p className="p-6 text-sm text-[#525252]">No status actions recorded yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
