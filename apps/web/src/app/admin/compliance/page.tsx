import { createServiceClient } from "@/lib/supabase/service";
import { ReviewQueue } from "@/components/review-queue";
import { RunSweepButton } from "@/components/run-sweep-button";

export const dynamic = "force-dynamic";

export default async function AdminCompliancePage() {
  const admin = createServiceClient();

  const pendingQuery = admin
    .from("documents")
    .select(
      "id, storage_path, reference_number, expiry_date, verification_status, professionals(full_name), document_types(name)",
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

  const { data: pending } = await pendingQuery;

  const itemsPromise = Promise.all(
    (pending ?? []).map(async (d) => {
      // Force Content-Disposition: attachment so user-supplied content cannot
      // execute in the admin's browser context on the supabase.co storage origin.
      const { data: signed } = await admin.storage
        .from("documents")
        .createSignedUrl(d.storage_path, 600, { download: true });
      return {
        documentId: d.id,
        professionalName: (d.professionals as { full_name: string } | null)?.full_name ?? "Professional",
        docTypeName: (d.document_types as { name: string } | null)?.name ?? "Document",
        status: d.verification_status,
        referenceNumber: d.reference_number,
        expiryDate: d.expiry_date,
        viewUrl: signed?.signedUrl ?? null,
      };
    }),
  );

  const [items, { data: nonCompliant }, { data: alerts }] = await Promise.all([
    itemsPromise,
    nonCompliantQuery,
    alertsQuery,
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-bold">Compliance</h1>
        </div>
        <RunSweepButton />
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Documents awaiting review</h2>
        <ReviewQueue items={items} />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Compliance alerts</h2>
        {alerts && alerts.length > 0 ? (
          <ul className="mt-4 divide-y divide-[#dbe7e0] border border-[#dbe7e0] text-sm">
            {alerts.map((a) => (
              <li key={a.id} className="flex justify-between p-3">
                <span>
                  {(a.professionals as { full_name: string } | null)?.full_name ?? "Professional"} —{" "}
                  <span className={a.alert_type === "expired" ? "text-[#da1e28]" : "text-[#684e1b]"}>
                    {a.alert_type}
                  </span>
                </span>
                {a.due_date && <span className="text-[#7a8a81]">due {a.due_date}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#5b6a62]">No active alerts.</p>
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
          <p className="mt-3 text-sm text-[#5b6a62]">All professionals are compliant.</p>
        )}
      </section>
    </main>
  );
}
