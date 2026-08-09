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
  neutral: "border-[#dbe7e0] bg-white",
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
      <p className="text-2xl font-bold text-[#1e5a33]">{value}</p>
      <p className="mt-1 text-sm text-[#4a4a4a]">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-[#7a8a81]">{hint}</p>}
    </div>
  );
}

export default async function AdminCompliancePage() {
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
      "id, full_name, ofsted_registration_number, registration_number, professional_status, professional_roles(name, code)",
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
    const role = p.professional_roles as { name: string; code: string } | null;
    const register = registerForRole(role?.code);
    if (!register) return [];
    const current = verificationByProfessional.get(`${p.id}-${register}`) ?? null;
    if (isVerificationCurrent(current)) return [];
    return [
      {
        professionalId: p.id,
        professionalName: p.full_name,
        roleName: role?.name ?? "",
        register,
        reference: register === "ofsted" ? p.ofsted_registration_number : p.registration_number,
        lastOutcome: current?.outcome ?? null,
        lastCheckedAt: current?.checked_at ?? null,
        validUntil: current?.valid_until ?? null,
      },
    ];
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-bold">Compliance</h1>
        </div>
        <RunSweepButton />
      </div>

      <section className="mt-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Fully compliant"
            value={overview.counts.green}
            tone="green"
            hint="Available for bookings"
          />
          <StatTile
            label="Expiring soon"
            value={overview.counts.amber}
            tone="amber"
            hint="Within the next 30 days"
          />
          <StatTile
            label="Compliance expired"
            value={overview.counts.red}
            tone="red"
            hint={`${overview.counts.autoRestricted} automatically restricted`}
          />
          <StatTile
            label="Awaiting approval"
            value={overview.counts.pending}
            tone="neutral"
            hint="Applications in progress"
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Expiring in 30 days" value={overview.counts.expiring30} tone="amber" />
          <StatTile label="31 to 60 days" value={overview.counts.expiring60} tone="neutral" />
          <StatTile label="61 to 90 days" value={overview.counts.expiring90} tone="neutral" />
          <StatTile
            label="Register checks outstanding"
            value={overview.counts.outstandingVerifications}
            tone={overview.counts.outstandingVerifications > 0 ? "red" : "green"}
          />
        </div>

        <p className="mt-3 text-xs text-[#7a8a81]">
          {overview.remindersSent} renewal reminder{overview.remindersSent === 1 ? "" : "s"} sent in
          the last 30 days.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Compliance status by professional</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7e0]">
          <table className="w-full text-sm">
            <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#4a4a4a]">
              <tr>
                <th className="p-3 font-medium">Professional</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Outstanding</th>
                <th className="p-3 font-medium">Next expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dbe7e0]">
              {overview.professionals.map((row) => (
                <tr key={row.professionalId}>
                  <td className="p-3">
                    <ForwardLink
                      href={`/admin/users/${row.professionalId}`}
                      className="text-[#2e7d32] hover:underline"
                    >
                      {row.fullName}
                    </ForwardLink>
                  </td>
                  <td className="p-3">{row.roleName ?? "—"}</td>
                  <td className="p-3">
                    <ComplianceLightBadge light={row.light} />
                  </td>
                  <td className="p-3 text-[#4a4a4a]">
                    {row.registrationLapsed && (
                      <span className="block text-xs text-[#a2191f]">Register check outstanding</span>
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
            <p className="p-6 text-sm text-[#4a4a4a]">No professionals registered yet.</p>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Documents approaching expiry</h2>
        {overview.expiring.length > 0 ? (
          <ul className="mt-4 divide-y divide-[#dbe7e0] border border-[#dbe7e0] text-sm">
            {overview.expiring.map((doc) => (
              <li
                key={`${doc.professionalId}-${doc.documentName}-${doc.expiryDate}`}
                className="flex flex-wrap justify-between gap-2 p-3"
              >
                <span>
                  {doc.professionalName} — {doc.documentName}
                </span>
                <span className={doc.bucket === "30" ? "text-[#684e1b]" : "text-[#7a8a81]"}>
                  expires {doc.expiryDate} ({doc.bucket === "30" ? "within 30" : doc.bucket === "60" ? "31–60" : "61–90"} days)
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#4a4a4a]">
            Nothing expires in the next 90 days.
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Documents awaiting review</h2>
        <ReviewQueue items={items} />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Registrations awaiting verification</h2>
        <p className="mt-2 text-sm text-[#4a4a4a]">
          Nurses, nannies and childminders cannot be activated until their registration has been
          checked against the public register. A check lasts twelve months.
        </p>
        <RegistrationVerificationPanel items={registrationChecks} />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Compliance alerts</h2>
        {alerts && alerts.length > 0 ? (
          <ul className="mt-4 divide-y divide-[#dbe7e0] border border-[#dbe7e0] text-sm">
            {alerts.map((a) => (
              <li key={a.id} className="flex justify-between p-3">
                <span>
                  {(a.professionals as { full_name: string } | null)?.full_name ?? "Professional"} —{" "}
                  <span
                    className={
                      a.alert_type.endsWith("expired") ? "text-[#da1e28]" : "text-[#684e1b]"
                    }
                  >
                    {a.alert_type.replace(/_/g, " ")}
                  </span>
                </span>
                {a.due_date && <span className="text-[#7a8a81]">due {a.due_date}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#4a4a4a]">No active alerts.</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Non-compliant professionals</h2>
        {nonCompliant && nonCompliant.length > 0 ? (
          <ul className="mt-4 divide-y divide-[#dbe7e0] border border-[#dbe7e0] text-sm">
            {nonCompliant.map((p) => (
              <li key={p.id} className="flex justify-between p-3">
                <span>{p.full_name}</span>
                <span className="text-[#7a8a81]">
                  {p.professional_status.replace(/_/g, " ")} · {p.compliance_status.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#4a4a4a]">All professionals are compliant.</p>
        )}
      </section>
    </main>
  );
}
