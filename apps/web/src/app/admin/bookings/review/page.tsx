import { Tr } from "@/components/portal-locale";
import { BackLink } from "@/components/back-link";
import { RiskReviewActions } from "@/components/risk-review-actions";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { getPortalLocale } from "@/lib/i18n/portal-server";
import { formatLondon } from "@/lib/format/datetime";
import {
  QUESTIONS,
  RESPONDENT_OPTIONS,
  REVIEW_REASON_LABEL,
  RISK_LEVEL_LABEL,
  ROLE_FAMILY_LABEL,
  type RoleFamily,
} from "@/lib/risk-assessment/questionnaire";

export const dynamic = "force-dynamic";

const LEVEL_STYLE: Record<string, string> = {
  high: "border-danger text-danger",
  unclear: "border-[#b7791f] text-[#7a4f0f]",
  medium: "border-line text-brand-ink",
  low: "border-line text-brand-ink",
};

/** Private-client requests the risk assessment held: admins approve (publish) or decline them. */
export default async function AdminBookingReviewPage() {
  if (!(await requireAdmin())) return null;
  const lang = (await getPortalLocale()) === "pt-PT" ? "pt" : "en";
  const admin = createServiceClient();
  const { data: bookings } = await admin
    .from("bookings")
    .select(
      "id, scheduled_start, duration_hours, location_address, location_postcode, notes, created_at, professional_roles(name, code), care_types(name), private_clients(full_name, phone, email_contact), booking_risk_assessments(respondent, answers, score, risk_level, recommended_role_family, chosen_role_family, review_reasons)",
    )
    .eq("status", "pending_review")
    .order("scheduled_start", { ascending: true });

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10">
      <BackLink href="/admin/bookings" className="text-sm font-semibold text-brand-strong hover:underline">
        <Tr>{"Bookings"}</Tr>
      </BackLink>
      <h1 className="mt-3 text-3xl font-bold"><Tr>{"Requests awaiting review"}</Tr></h1>
      <p className="mt-2 text-sm text-ink">
        <Tr>{"The risk and needs assessment held these private-client requests. Professionals cannot see them until you approve them. The assessment is guidance, not a medical diagnosis."}</Tr>
      </p>

      {(bookings ?? []).length === 0 && (
        <p className="mt-8 rounded-xl border border-line p-6 text-sm text-ink"><Tr>{"No requests are waiting for review."}</Tr></p>
      )}

      <div className="mt-8 space-y-6">
        {(bookings ?? []).map((b) => {
          const ra = b.booking_risk_assessments;
          const answers = (ra?.answers ?? {}) as Record<string, string>;
          const level = ra?.risk_level ?? "unclear";
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
                <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${LEVEL_STYLE[level] ?? ""}`}>
                  <Tr>{"Risk"}</Tr>: {RISK_LEVEL_LABEL[level as keyof typeof RISK_LEVEL_LABEL]?.[lang] ?? level} ({ra?.score ?? "—"})
                </span>
              </div>

              {ra ? (
                <>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-medium"><Tr>{"Recommended"}</Tr></dt>
                      <dd>{ROLE_FAMILY_LABEL[ra.recommended_role_family as RoleFamily]?.[lang] ?? ra.recommended_role_family}</dd>
                    </div>
                    <div>
                      <dt className="font-medium"><Tr>{"Completed by"}</Tr></dt>
                      <dd>{RESPONDENT_OPTIONS.find((r) => r.id === ra.respondent)?.label[lang] ?? ra.respondent}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-medium"><Tr>{"Why it is held"}</Tr></dt>
                      <dd>
                        <ul className="mt-1 list-disc pl-5">
                          {ra.review_reasons.map((r) => <li key={r}>{REVIEW_REASON_LABEL[r]?.[lang] ?? r}</li>)}
                        </ul>
                      </dd>
                    </div>
                  </dl>
                  <details className="rounded-xl border border-line bg-surface p-4 text-sm">
                    <summary className="cursor-pointer font-medium"><Tr>{"Answers"}</Tr></summary>
                    <dl className="mt-3 space-y-2">
                      {QUESTIONS.map((q) => (
                        <div key={q.id}>
                          <dt className="text-muted">{q.label[lang]}</dt>
                          <dd className="font-medium text-brand-ink">{q.options.find((o) => o.id === answers[q.id])?.label[lang] ?? "—"}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
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

              <RiskReviewActions bookingId={b.id} />
            </article>
          );
        })}
      </div>
    </main>
  );
}
