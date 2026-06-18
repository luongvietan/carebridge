import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { ForwardLink } from "@/components/forward-link";
import { AccountStatusControl } from "@/components/account-status-control";
import { StatusActionForm } from "@/components/status-action-form";
import { requireAdmin } from "@/lib/auth/admin";
import type { AccountStatus } from "@/lib/admin/account-status";
import type { ProfessionalStatus } from "@/lib/admin/status-machine";
import { createServiceClient } from "@/lib/supabase/service";
import {
  employmentStatusLabels,
  mandatoryTrainingItems,
} from "@/lib/validation/onboarding";
import { DAYS_OF_WEEK } from "@/lib/onboarding/profile-children";

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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" });
}

const cardClass =
  "mt-10 rounded-2xl border border-[#dbe7e0] bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)] text-sm";

type EligibilityScreening = {
  employment_status: string | null;
  training_current: boolean;
  outcome: string;
} | null;

function EligibilityScreeningCard({
  screening,
  attestations,
}: {
  screening: EligibilityScreening;
  attestations: Record<string, boolean>;
}) {
  return (
    <section className={cardClass}>
      <h2 className="text-lg font-bold">Eligibility screening</h2>
      {!screening ? (
        <p className="mt-4 text-[#5b6a62]">No eligibility screening on record.</p>
      ) : (
        <>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-[#7a8a81]">Employment status</dt>
              <dd>
                {screening.employment_status
                  ? (employmentStatusLabels[
                      screening.employment_status as keyof typeof employmentStatusLabels
                    ] ?? formatLabel(screening.employment_status))
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[#7a8a81]">Mandatory training</dt>
              <dd>
                {screening.training_current ? (
                  <span className="text-[#0e6027]">All attested current</span>
                ) : (
                  <span className="text-[#a2191f]">
                    Not current — updated certificate required before approval
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[#7a8a81]">Outcome</dt>
              <dd>{formatLabel(screening.outcome)}</dd>
            </div>
          </dl>
          <ul className="mt-4 grid gap-1 sm:grid-cols-2">
            {mandatoryTrainingItems.map((t) => (
              <li key={t.key} className="flex items-center gap-2">
                <span aria-hidden className={attestations[t.key] ? "text-[#0e6027]" : "text-[#a2191f]"}>
                  {attestations[t.key] ? "✓" : "✗"}
                </span>
                <span>{t.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

type StatusActionRow = {
  action_type: string;
  reason_code: string | null;
  reason_text: string | null;
  internal_notes: string | null;
  review_date: string | null;
  resulting_status: string | null;
  applied_at: string;
  resolved_at: string | null;
  applied_by: string | null;
};

function StatusHistoryCard({
  history,
  actorEmail,
}: {
  history: StatusActionRow[];
  actorEmail: Map<string, string>;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold">Status action history</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#5b6a62]">
            <tr>
              <th className="p-3 font-medium">Applied</th>
              <th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Reason</th>
              <th className="p-3 font-medium">Internal notes</th>
              <th className="p-3 font-medium">Review date</th>
              <th className="p-3 font-medium">Resulting status</th>
              <th className="p-3 font-medium">Resolved</th>
              <th className="p-3 font-medium">By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dbe7e0]">
            {history.map((row, index) => (
              <tr key={`${row.applied_at}-${index}`}>
                <td className="p-3 whitespace-nowrap">{formatDateTime(row.applied_at)}</td>
                <td className="p-3">{formatLabel(row.action_type)}</td>
                <td className="p-3">
                  {row.reason_code ? formatLabel(row.reason_code) : "—"}
                  {row.reason_text ? (
                    <div className="text-xs text-[#7a8a81]">{row.reason_text}</div>
                  ) : null}
                </td>
                <td className="p-3">{row.internal_notes ?? "—"}</td>
                <td className="p-3 whitespace-nowrap">
                  {row.review_date ? formatDate(row.review_date) : "—"}
                </td>
                <td className="p-3">
                  {row.resulting_status ? formatLabel(row.resulting_status) : "—"}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {row.resolved_at ? formatDateTime(row.resolved_at) : "—"}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {row.applied_by ? (actorEmail.get(row.applied_by) ?? "—") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 && (
          <p className="p-6 text-sm text-[#5b6a62]">No status actions recorded yet.</p>
        )}
      </div>
    </section>
  );
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
      "id, full_name, professional_status, compliance_status, professional_role_id, user_id, profile_photo_path, registration_body, registration_number, professional_roles(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!professional) notFound();

  // The profile photo lives in the private documents bucket; sign a short-lived
  // URL so the admin can view it during identity verification.
  const photoUrl = professional.profile_photo_path
    ? (
        await admin.storage
          .from("documents")
          .createSignedUrl(professional.profile_photo_path, 600)
      ).data?.signedUrl ?? null
    : null;

  const [
    { data: user },
    { data: history },
    { data: attempts },
    { data: screening },
    { data: skillRows },
    { data: availabilityRows },
  ] = await Promise.all([
    admin
      .from("users")
      .select("email, account_status")
      .eq("id", professional.user_id)
      .maybeSingle(),
    admin
      .from("professional_status_actions")
      .select(
        "action_type, reason_code, reason_text, internal_notes, review_date, resulting_status, applied_at, resolved_at, applied_by",
      )
      .eq("professional_id", id)
      .order("applied_at", { ascending: false }),
    admin
      .from("assessment_attempts")
      .select("assessment_cycle, attempt_number, score, passed, completed_at")
      .eq("professional_id", id)
      .order("assessment_cycle", { ascending: true })
      .order("attempt_number", { ascending: true }),
    admin
      .from("eligibility_screenings")
      .select("employment_status, training_current, outcome, training_attestations, submitted_at")
      .eq("professional_id", id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("professional_skills").select("skills(name)").eq("professional_id", id),
    admin.from("professional_availability").select("day_of_week").eq("professional_id", id),
  ]);

  const actorIds = [
    ...new Set((history ?? []).map((h) => h.applied_by).filter((x): x is string => Boolean(x))),
  ];
  const { data: actors } = actorIds.length
    ? await admin.from("users").select("id, email").in("id", actorIds)
    : { data: [] as { id: string; email: string }[] };
  const actorEmail = new Map((actors ?? []).map((a) => [a.id, a.email] as const));

  const attestations = (screening?.training_attestations ?? {}) as Record<string, boolean>;
  const skillNames = (skillRows ?? []).flatMap((r) => {
    const name = (r.skills as { name: string } | null)?.name;
    return name ? [name] : [];
  });
  const availabilityDays = new Set(
    (availabilityRows ?? []).map((r) => r.day_of_week).filter((d): d is number => d != null),
  );

  const completedAttempts = (attempts ?? []).filter((a) => a.completed_at);
  const bestScore = completedAttempts.reduce<number | null>(
    (best, a) => (a.score != null && (best == null || a.score > best) ? a.score : best),
    null,
  );
  const hasPassed = completedAttempts.some((a) => a.passed);
  // Attempts are counted per reapplication cycle (see migration 0051). Show the
  // latest cycle's usage so "attempts used / 3" is meaningful after a reapply.
  const latestCycle = completedAttempts.reduce((max, a) => Math.max(max, a.assessment_cycle ?? 1), 0);
  const attemptsThisCycle = completedAttempts.filter((a) => (a.assessment_cycle ?? 1) === latestCycle).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="text-3xl font-bold">{professional.full_name}</h1>
        <BackLink href="/admin/users" className="text-sm text-[#2e7d32] hover:underline">
          Back to list
        </BackLink>
      </div>

      <section className="mt-8 rounded-2xl border border-[#dbe7e0] bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)] text-sm">
        <div className="flex items-start gap-4">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`${professional.full_name} profile photo`}
              className="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-[#dbe7e0]"
            />
          ) : (
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#eef5f0] text-xs text-[#7a8a81]">
              No photo
            </div>
          )}
          <h2 className="text-lg font-bold">Profile</h2>
        </div>
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
            <dt className="text-[#7a8a81]">Professional registration</dt>
            <dd>
              {professional.registration_body || professional.registration_number
                ? `${professional.registration_body ?? "—"} ${professional.registration_number ?? ""}`.trim()
                : "—"}
            </dd>
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
          <div>
            <dt className="text-[#7a8a81]">Skills &amp; specialities</dt>
            <dd>{skillNames.length > 0 ? skillNames.join(", ") : "—"}</dd>
          </div>
          <div>
            <dt className="text-[#7a8a81]">Availability</dt>
            <dd>
              {availabilityDays.size > 0
                ? DAYS_OF_WEEK.filter((d) => availabilityDays.has(d.value))
                    .map((d) => d.label)
                    .join(", ")
                : "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-4">
          <ForwardLink href="/admin/compliance" className="text-[#2e7d32] hover:underline">
            View compliance documents
          </ForwardLink>
        </p>
      </section>

      <EligibilityScreeningCard screening={screening} attestations={attestations} />

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
            <dd>
              {attemptsThisCycle} / 3
              {latestCycle > 1 ? ` (reapplication ${latestCycle})` : ""}
            </dd>
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
                  <tr key={`${a.assessment_cycle ?? 1}-${a.attempt_number}`}>
                    <td className="p-3">
                      {latestCycle > 1 ? `${a.assessment_cycle ?? 1}.${a.attempt_number}` : a.attempt_number}
                    </td>
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

      <StatusHistoryCard history={history ?? []} actorEmail={actorEmail} />
    </main>
  );
}
