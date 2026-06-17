import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { ForwardLink } from "@/components/forward-link";
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

  const [{ data: user }, { data: history }, { data: attempts }] = await Promise.all([
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
    admin
      .from("assessment_attempts")
      .select("attempt_number, score, passed, completed_at")
      .eq("professional_id", id)
      .order("attempt_number", { ascending: true }),
  ]);

  const completedAttempts = (attempts ?? []).filter((a) => a.completed_at);
  const bestScore = completedAttempts.reduce<number | null>(
    (best, a) => (a.score != null && (best == null || a.score > best) ? a.score : best),
    null,
  );
  const hasPassed = completedAttempts.some((a) => a.passed);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="text-3xl font-bold">{professional.full_name}</h1>
        <BackLink href="/admin/users" className="text-sm text-[#2e7d32] hover:underline">
          Back to list
        </BackLink>
      </div>

      <section className="mt-8 rounded-2xl border border-[#dbe7e0] bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)] text-sm">
        <h2 className="text-lg font-bold">Profile</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[#7a8a81]">Email</dt>
            <dd>{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[#7a8a81]">Role</dt>
            <dd>{(professional.professional_roles as { name: string } | null)?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[#7a8a81]">Professional status</dt>
            <dd>{formatLabel(professional.professional_status)}</dd>
          </div>
          <div>
            <dt className="text-[#7a8a81]">Compliance status</dt>
            <dd>{formatLabel(professional.compliance_status)}</dd>
          </div>
          <div>
            <dt className="text-[#7a8a81]">Account status</dt>
            <dd>{user?.account_status ? formatLabel(user.account_status) : "—"}</dd>
          </div>
        </dl>
        <p className="mt-4">
          <ForwardLink href="/admin/compliance" className="text-[#2e7d32] hover:underline">
            View compliance documents
          </ForwardLink>
        </p>
      </section>

      <section className="mt-10 rounded-2xl border border-[#dbe7e0] bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)] text-sm">
        <h2 className="text-lg font-bold">Competency assessment</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-[#7a8a81]">Result</dt>
            <dd>
              {completedAttempts.length === 0
                ? "Not yet attempted"
                : hasPassed
                  ? "Passed"
                  : "Not passed"}
            </dd>
          </div>
          <div>
            <dt className="text-[#7a8a81]">Best score</dt>
            <dd>{bestScore != null ? `${bestScore}%` : "—"}</dd>
          </div>
          <div>
            <dt className="text-[#7a8a81]">Attempts used</dt>
            <dd>{completedAttempts.length} / 3</dd>
          </div>
        </dl>
        {completedAttempts.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#dbe7e0]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#5b6a62]">
                <tr>
                  <th className="p-3 font-medium">Attempt</th>
                  <th className="p-3 font-medium">Score</th>
                  <th className="p-3 font-medium">Result</th>
                  <th className="p-3 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbe7e0]">
                {completedAttempts.map((a) => (
                  <tr key={a.attempt_number}>
                    <td className="p-3">{a.attempt_number}</td>
                    <td className="p-3">{a.score != null ? `${a.score}%` : "—"}</td>
                    <td className="p-3">{a.passed ? "Pass" : "Fail"}</td>
                    <td className="p-3 whitespace-nowrap">
                      {a.completed_at ? formatDateTime(a.completed_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10 rounded-2xl border border-[#dbe7e0] bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
        <h2 className="text-lg font-bold">Professional status action</h2>
        <div className="mt-4">
          <StatusActionForm
            professionalId={professional.id}
            currentStatus={professional.professional_status as ProfessionalStatus}
          />
        </div>
      </section>

      {user?.account_status && (
        <section className="mt-10 rounded-2xl border border-[#dbe7e0] bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <h2 className="text-lg font-bold">Account access</h2>
          <div className="mt-4">
            <AccountStatusControl
              userId={professional.user_id}
              current={user.account_status as AccountStatus}
            />
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-bold">Status action history</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <table className="w-full text-sm">
            <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#5b6a62]">
              <tr>
                <th className="p-3 font-medium">Applied</th>
                <th className="p-3 font-medium">Action</th>
                <th className="p-3 font-medium">Reason</th>
                <th className="p-3 font-medium">Resulting status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dbe7e0]">
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
            <p className="p-6 text-sm text-[#5b6a62]">No status actions recorded yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
