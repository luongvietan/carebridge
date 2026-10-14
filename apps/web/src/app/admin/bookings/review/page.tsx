import { Tr } from "@/components/portal-locale";
import { BackLink } from "@/components/back-link";
import { RiskReviewActions } from "@/components/risk-review-actions";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { getPortalLocale } from "@/lib/i18n/portal-server";
import { formatLondon } from "@/lib/format/datetime";
import {
  BAND_LABEL,
  CLINICAL_REVIEW,
  FLAGS,
  OUTCOME_LABEL,
  RESPONDENT_OPTIONS,
  ROLE_FAMILY_LABEL,
  SECTIONS,
  type Outcome,
  type RoleFamily,
} from "@/lib/risk-assessment/questionnaire";
import { needsClinicalReview, visibleQuestions, withRespondent } from "@/lib/risk-assessment/score";
import { BRIEF_LABEL } from "@/lib/risk-assessment/brief";

export const dynamic = "force-dynamic";

const BAND_STYLE: Record<string, string> = {
  red: "border-danger text-danger",
  amber: "border-[#b7791f] text-[#7a4f0f]",
  green: "border-line text-brand-ink",
};
const FLAG_STYLE: Record<string, string> = {
  scope: "bg-[#fdecec] text-danger",
  nursing: "bg-[#e8f0fb] text-[#1d4f91]",
  red: "bg-[#fdecec] text-danger",
  amber: "bg-[#fff8e8] text-[#6b4e12]",
};

/** Private-client requests the risk and needs assessment held: approve, ask for more, or decline. */
export default async function AdminBookingReviewPage() {
  const adminId = await requireAdmin();
  if (!adminId) return null;
  const lang = (await getPortalLocale()) === "pt-PT" ? "pt" : "en";
  const admin = createServiceClient();
  const { data: bookings } = await admin
    .from("bookings")
    .select(
      "id, scheduled_start, duration_hours, location_address, location_postcode, notes, professional_role_id, professional_roles(name, country_code), care_types(name), private_clients(full_name, phone, email_contact), booking_risk_assessments(questionnaire_version, respondent, answers, score, risk_level, outcome, recommended_role_family, review_reasons, review_decision, client_message, reviewed_at), booking_safety_briefs(items)",
    )
    .eq("status", "pending_review")
    .order("scheduled_start", { ascending: true });

  const { data: me } = await admin.from("users").select("is_clinical_reviewer").eq("id", adminId).maybeSingle();
  const isClinicalReviewer = !!me?.is_clinical_reviewer;
  // Every view of the assessments is recorded under the reviewer's own account.
  if (bookings?.length) {
    await admin.from("audit_log").insert(
      bookings.map((b) => ({
        actor_user_id: adminId,
        actor_type: "admin",
        action: "risk_assessment.viewed",
        entity_type: "booking",
        entity_id: b.id,
      })),
    );
  }

  const countries = [...new Set((bookings ?? []).flatMap((b) => (b.professional_roles?.country_code ? [b.professional_roles.country_code] : [])))];
  const { data: roles } = countries.length
    ? await admin
        .from("professional_roles")
        .select("id, name, country_code, role_categories(name, sort_order)")
        .eq("is_active", true)
        .in("country_code", countries)
        .order("name")
    : { data: [] };

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10">
      <BackLink href="/admin/bookings" className="text-sm font-semibold text-brand-strong hover:underline">
        <Tr>{"Bookings"}</Tr>
      </BackLink>
      <h1 className="mt-3 text-3xl font-bold"><Tr>{"Requests awaiting review"}</Tr></h1>
      <p className="mt-2 text-sm text-ink">
        <Tr>{"The risk and needs assessment held these private-client requests. Professionals cannot see them until you approve them. The assessment is a screening and routing tool, not a diagnosis — your judgement decides."}</Tr>
      </p>
      <p className="mt-2 text-sm text-ink">
        <Tr>{"Nursing and red-risk requests can only be decided by a clinical reviewer. Your views and decisions are recorded in the audit log."}</Tr>
      </p>
      <p className="mt-2 text-xs text-muted">
        {CLINICAL_REVIEW.statement} ({CLINICAL_REVIEW.version}, {CLINICAL_REVIEW.date}) {CLINICAL_REVIEW.pending}
      </p>

      {(bookings ?? []).length === 0 && (
        <p className="mt-8 rounded-xl border border-line p-6 text-sm text-ink"><Tr>{"No requests are waiting for review."}</Tr></p>
      )}

      <div className="mt-8 space-y-6">
        {(bookings ?? []).map((b) => {
          const ra = b.booking_risk_assessments;
          const answers = (ra?.answers ?? {}) as Record<string, string>;
          const band = ra?.risk_level ?? "red";
          const clinical = !ra || needsClinicalReview(ra.risk_level, ra.outcome);
          const shown = ra ? visibleQuestions(withRespondent(ra.respondent, answers)) : [];
          const countryRoles = (roles ?? []).flatMap((r) =>
            r.country_code === b.professional_roles?.country_code
              ? [{ id: r.id, name: r.name, category: r.role_categories?.name ?? "" }]
              : [],
          );
          return (
            <article key={b.id} className="space-y-4 rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-heading">
                    {b.professional_roles?.name}
                    {b.care_types?.name ? ` · ${b.care_types.name}` : ""}
                  </h2>
                  <p className="text-sm text-ink">
                    {formatLondon(b.scheduled_start)} · {b.duration_hours} h · {b.location_address}
                    {b.location_postcode ? `, ${b.location_postcode}` : ""}
                  </p>
                  <p className="text-sm text-ink">
                    {b.private_clients?.full_name}
                    {b.private_clients?.phone ? ` · ${b.private_clients.phone}` : ""}
                    {b.private_clients?.email_contact ? ` · ${b.private_clients.email_contact}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${BAND_STYLE[band] ?? BAND_STYLE.red}`}>
                    {BAND_LABEL[band as keyof typeof BAND_LABEL]?.[lang] ?? band} · {ra?.score ?? "—"}
                  </span>
                  {clinical && (
                    <span className="rounded-full bg-[#e8f0fb] px-3 py-1 text-xs font-semibold text-[#1d4f91]">
                      <Tr>{"Clinical review required"}</Tr>
                    </span>
                  )}
                </div>
              </div>

              {ra ? (
                <>
                  <dl className="grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="font-medium"><Tr>{"Outcome"}</Tr></dt>
                      <dd>{ra.outcome ? `${ra.outcome} — ${OUTCOME_LABEL[ra.outcome as Outcome]?.[lang] ?? ""}` : "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium"><Tr>{"Recommended"}</Tr></dt>
                      <dd>{ROLE_FAMILY_LABEL[ra.recommended_role_family as RoleFamily]?.[lang] ?? ra.recommended_role_family}</dd>
                    </div>
                    <div>
                      <dt className="font-medium"><Tr>{"Completed by"}</Tr></dt>
                      <dd>{RESPONDENT_OPTIONS.find((r) => r.id === ra.respondent)?.label[lang] ?? ra.respondent}</dd>
                    </div>
                  </dl>
                  <div>
                    <h3 className="text-sm font-medium"><Tr>{"Why it is held"}</Tr></h3>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {ra.review_reasons.map((f) => (
                        <li key={f} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${FLAG_STYLE[FLAGS[f]?.level ?? "amber"]}`}>
                          {FLAGS[f]?.label[lang] ?? f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {ra.review_decision === "more_info_requested" && (
                    <p className="rounded-xl border border-line bg-surface p-3 text-sm">
                      <span className="font-medium"><Tr>{"More information requested"}</Tr></span>
                      {ra.reviewed_at ? ` · ${formatLondon(ra.reviewed_at)}` : ""}
                      {ra.client_message ? <span className="mt-1 block whitespace-pre-wrap">{ra.client_message}</span> : null}
                    </p>
                  )}
                  <details className="rounded-xl border border-line bg-surface p-4 text-sm">
                    <summary className="cursor-pointer font-medium"><Tr>{"Answers"}</Tr></summary>
                    {SECTIONS.map((section) => {
                      const qs = shown.filter((q) => q.section === section.id);
                      if (!qs.length) return null;
                      return (
                        <div key={section.id} className="mt-4">
                          <h4 className="font-semibold text-brand-ink">{section.title[lang]}</h4>
                          <dl className="mt-2 space-y-2">
                            {qs.map((q) => (
                              <div key={q.id}>
                                <dt className="text-muted">{q.id}. {q.label[lang]}</dt>
                                <dd className="font-medium text-brand-ink">{q.options.find((o) => o.id === answers[q.id])?.label[lang] ?? answers[q.id] ?? "—"}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      );
                    })}
                  </details>
                  <div className="rounded-xl border border-line p-4 text-sm">
                    <h3 className="font-medium"><Tr>{"What the matched professional will see"}</Tr></h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {(b.booking_safety_briefs?.items ?? []).map((item) => <li key={item}>{BRIEF_LABEL[item]?.[lang] ?? item}</li>)}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-sm text-danger"><Tr>{"No assessment was found for this request."}</Tr></p>
              )}

              {b.notes && (
                <p className="whitespace-pre-wrap rounded-xl border border-line p-3 text-sm">
                  <span className="block font-medium"><Tr>{"Notes"}</Tr></span>
                  {b.notes}
                </p>
              )}

              {clinical && !isClinicalReviewer ? (
                <p className="rounded-xl border border-line bg-surface p-3 text-sm text-ink">
                  <Tr>{"This request needs a clinical reviewer. It stays on hold until a clinical reviewer approves it, asks for more information, changes the professional category or declines it."}</Tr>
                </p>
              ) : (
                <RiskReviewActions bookingId={b.id} currentRoleId={b.professional_role_id} roles={countryRoles} />
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
