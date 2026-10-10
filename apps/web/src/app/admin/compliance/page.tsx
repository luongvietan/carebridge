import { getPortalT } from "@/lib/i18n/portal-server";
import { Tr } from "@/components/portal-locale";
import { TableScroll } from "@/components/table-scroll";
import { AdminTableHeader } from "@/components/admin-table-header";
import { createServiceClient } from "@/lib/supabase/service";
import { ReviewQueue } from "@/components/review-queue";
import { RunSweepButton } from "@/components/run-sweep-button";
import { isImageStoragePath } from "@/lib/onboarding/upload-rules";
import {
  RegistrationVerificationPanel,
  type RegistrationCheckItem,
} from "@/components/registration-verification-panel";
import { registerForRole } from "@/lib/compliance/regulated-roles";
import { isVerificationCurrent } from "@/lib/compliance/registration-verification";
import { loadComplianceOverview } from "@/lib/compliance/overview";
import { ComplianceLightBadge } from "@/components/compliance-light";
import { ForwardLink } from "@/components/forward-link";

export const dynamic = "force-dynamic";

const TILE_TONE = {
  green: "border-[#a7e0b8] bg-[#f2fbf5]",
  amber: "border-[#f0dfa0] bg-[#fefbf0]",
  red: "border-[#f5b8bb] bg-[#fff5f5]",
  neutral: "border-line bg-white",
} as const;

function StatTile({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: number;
  tone?: keyof typeof TILE_TONE;
  hint?: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${TILE_TONE[tone]}`}>
      <p className="text-2xl font-bold text-brand-ink">{value}</p>
      <p className="mt-1 text-sm text-ink">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default async function AdminCompliancePage() {
  const t = await getPortalT();

  const admin = createServiceClient();

  const pendingQuery = admin
    .from("documents")
    .select(
      "id, storage_path, original_filename, reference_number, expiry_date, verification_status, professionals(full_name), document_types(name)",
    )
    .in("verification_status", ["pending_review", "further_info_required"])
    .is("superseded_at", null)
    .order("created_at", { ascending: true });

  const nonCompliantQuery = admin
    .from("professionals")
    .select("id, full_name, professional_status, compliance_status")
    .neq("compliance_status", "approved")
    .order("created_at", { ascending: false });

  const alertsQuery = admin
    .from("compliance_alerts")
    .select("id, alert_type, due_date, professionals(full_name)")
    .eq("acknowledged", false)
    .order("due_date", { ascending: true });

  // Regulated professionals and their latest register check. The client's
  // requirement is that they cannot be approved until the registration has been
  // verified, so this list is the administrator's queue for doing it.
  const regulatedQuery = admin
    .from("professionals")
    .select(
      "id, full_name, ofsted_registration_number, registration_number, iss_authorisation_number, professional_status, professional_roles(name, code, registration_register)",
    )
    .not("professional_role_id", "is", null)
    .neq("professional_status", "removed")
    .order("created_at", { ascending: true });

  const verificationsQuery = admin
    .from("v_current_registration_verification")
    .select("professional_id, register, outcome, checked_at, valid_until");

  const { data: pending } = await pendingQuery;

  const itemsPromise = Promise.all(
    (pending ?? []).map(async (d) => {
      const isImage = isImageStoragePath(d.storage_path);
      const downloadName = d.original_filename ?? undefined;
      // Inline preview: JPEG/PNG are bucket-locked and safe in <img>; PDFs open in
      // a sandboxed iframe. A separate attachment URL is kept for explicit download.
      const [{ data: previewSigned }, { data: downloadSigned }] = await Promise.all([
        admin.storage.from("documents").createSignedUrl(d.storage_path, 600),
        admin.storage
          .from("documents")
          .createSignedUrl(d.storage_path, 600, { download: downloadName ?? true }),
      ]);
      return {
        documentId: d.id,
        professionalName: (d.professionals as { full_name: string } | null)?.full_name ?? "Professional",
        docTypeName: (d.document_types as { name: string } | null)?.name ?? "Document",
        status: d.verification_status,
        referenceNumber: d.reference_number,
        expiryDate: d.expiry_date,
        contentKind: isImage ? ("image" as const) : ("pdf" as const),
        previewUrl: previewSigned?.signedUrl ?? null,
        downloadUrl: downloadSigned?.signedUrl ?? null,
      };
    }),
  );

  const [
    items,
    { data: nonCompliant },
    { data: alerts },
    { data: regulated },
    { data: verifications },
    overview,
  ] = await Promise.all([
    itemsPromise,
    nonCompliantQuery,
    alertsQuery,
    regulatedQuery,
    verificationsQuery,
    loadComplianceOverview(admin),
  ]);

  const verificationByProfessional = new Map(
    (verifications ?? []).map((v) => [`${v.professional_id}-${v.register}`, v]),
  );

  const registrationChecks: RegistrationCheckItem[] = (regulated ?? []).flatMap((p) => {
    const role = p.professional_roles as
      | { name: string; code: string; registration_register: string | null }
      | null;
    const register = registerForRole(role);
    if (!register) return [];
    const current = verificationByProfessional.get(`${p.id}-${register}`) ?? null;
    if (isVerificationCurrent(current)) return [];
    return [
      {
        professionalId: p.id,
        professionalName: p.full_name,
        roleName: role?.name ?? "",
        register,
        reference:
          register === "ofsted"
            ? p.ofsted_registration_number
            : register === "iss"
              ? p.iss_authorisation_number
              : p.registration_number,
        lastOutcome: current?.outcome ?? null,
        lastCheckedAt: current?.checked_at ?? null,
        validUntil: current?.valid_until ?? null,
      },
    ];
  });

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-bold"><Tr>{"Compliance"}</Tr></h1>
        </div>
        <RunSweepButton />
      </div>

      <section className="mt-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={t("Fully compliant")}
            value={overview.counts.green}
            tone="green"
            hint={t("Available for bookings")}
          />
          <StatTile
            label={t("Expiring soon")}
            value={overview.counts.amber}
            tone="amber"
            hint={t("Within the next 30 days")}
          />
          <StatTile
            label={t("Compliance expired")}
            value={overview.counts.red}
            tone="red"
            hint={t("{n} automatically restricted", { n: overview.counts.autoRestricted })}
          />
          <StatTile
            label={t("Awaiting approval")}
            value={overview.counts.pending}
            tone="neutral"
            hint={t("Applications in progress")}
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label={t("Expiring in 30 days")} value={overview.counts.expiring30} tone="amber" />
          <StatTile label={t("31 to 60 days")} value={overview.counts.expiring60} tone="neutral" />
          <StatTile label={t("61 to 90 days")} value={overview.counts.expiring90} tone="neutral" />
          <StatTile
            label={t("Register checks outstanding")}
            value={overview.counts.outstandingVerifications}
            tone={overview.counts.outstandingVerifications > 0 ? "red" : "green"}
          />
        </div>

        <p className="mt-3 text-xs text-muted">
          {overview.remindersSent}<Tr>{"renewal reminder"}</Tr><Tr>{overview.remindersSent === 1 ? "" : "s"}</Tr><Tr>{"sent in the last 30 days."}</Tr></p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold"><Tr>{"Compliance status by professional"}</Tr></h2>
        <TableScroll className="mt-4 rounded-2xl border border-line">
          <table className="w-full text-sm">
            <AdminTableHeader>
              <tr>
                <th className="p-3 font-medium"><Tr>{"Professional"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Role"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Status"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Outstanding"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Next expiry"}</Tr></th>
              </tr>
            </AdminTableHeader>
            <tbody className="divide-y divide-line">
              {overview.professionals.map((row) => (
                <tr key={row.professionalId}>
                  <td className="p-3">
                    <ForwardLink
                      href={`/admin/users/${row.professionalId}`}
                      className="text-brand-strong hover:underline"
                    >
                      {row.fullName}
                    </ForwardLink>
                  </td>
                  <td className="p-3">{row.roleName ?? "—"}</td>
                  <td className="p-3">
                    <ComplianceLightBadge light={row.light} />
                  </td>
                  <td className="p-3 text-ink">
                    {row.registrationLapsed && (
                      <span className="block text-xs text-[#a2191f]"><Tr>{"Register check outstanding"}</Tr></span>
                    )}
                    {row.outstandingDocuments.length > 0
                      ? row.outstandingDocuments.join(", ")
                      : row.registrationLapsed
                        ? ""
                        : "—"}
                  </td>
                  <td className="p-3 whitespace-nowrap">{row.soonestExpiry ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {overview.professionals.length === 0 && (
            <p className="p-6 text-sm text-ink"><Tr>{"No professionals registered yet."}</Tr></p>
          )}
        </TableScroll>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold"><Tr>{"Documents approaching expiry"}</Tr></h2>
        {overview.expiring.length > 0 ? (
          <ul className="mt-4 divide-y divide-line border border-line text-sm">
            {overview.expiring.map((doc) => (
              <li
                key={`${doc.professionalId}-${doc.documentName}-${doc.expiryDate}`}
                className="flex flex-wrap justify-between gap-2 p-3"
              >
                <span>
                  {doc.professionalName} — {doc.documentName}
                </span>
                <span className={doc.bucket === "30" ? "text-[#684e1b]" : "text-muted"}><Tr>{"expires"}</Tr>{doc.expiryDate} ({doc.bucket === "30" ? "within 30" : doc.bucket === "60" ? "31–60" : "61–90"}<Tr>{"days)"}</Tr></span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink"><Tr>{"Nothing expires in the next 90 days."}</Tr></p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold"><Tr>{"Documents awaiting review"}</Tr></h2>
        <ReviewQueue items={items} />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold"><Tr>{"Registrations awaiting verification"}</Tr></h2>
        <p className="mt-2 text-sm text-ink"><Tr>{"Nurses, nannies and childminders cannot be activated until their registration has been checked against the public register. A check lasts twelve months."}</Tr></p>
        <RegistrationVerificationPanel items={registrationChecks} />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold"><Tr>{"Compliance alerts"}</Tr></h2>
        {alerts && alerts.length > 0 ? (
          <ul className="mt-4 divide-y divide-line border border-line text-sm">
            {alerts.map((a) => (
              <li key={a.id} className="flex justify-between p-3">
                <span>
                  {(a.professionals as { full_name: string } | null)?.full_name ?? "Professional"} —{" "}
                  <span
                    className={a.alert_type.endsWith("expired") ? "text-danger" : "text-[#684e1b]"}
                  >
                    {a.alert_type.replace(/_/g, " ")}
                  </span>
                </span>
                {a.due_date && <span className="text-muted"><Tr>{"due"}</Tr>{a.due_date}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink"><Tr>{"No active alerts."}</Tr></p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold"><Tr>{"Non-compliant professionals"}</Tr></h2>
        {nonCompliant && nonCompliant.length > 0 ? (
          <ul className="mt-4 divide-y divide-line border border-line text-sm">
            {nonCompliant.map((p) => (
              <li key={p.id} className="flex justify-between p-3">
                <span>{p.full_name}</span>
                <span className="text-muted">
                  {p.professional_status.replace(/_/g, " ")} · {p.compliance_status.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink"><Tr>{"All professionals are compliant."}</Tr></p>
        )}
      </section>
    </main>
  );
}
