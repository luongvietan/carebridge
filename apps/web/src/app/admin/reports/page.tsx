import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { DATASETS, type DatasetName } from "@/lib/export/datasets";
import { DatePicker } from "@/components/ui/date-picker";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; entity_type?: string; actor_type?: string }>;
}) {
  if (!(await requireAdmin())) redirect("/login");
  const { from, to, entity_type, actor_type } = await searchParams;
  const admin = createServiceClient();

  let auditQuery = admin
    .from("v_export_audit")
    .select("id, occurred_at, actor_type, action, entity_type, entity_id, summary")
    .order("occurred_at", { ascending: false })
    .limit(50);
  if (from) auditQuery = auditQuery.gte("occurred_at", from);
  if (to) auditQuery = auditQuery.lte("occurred_at", to + "T23:59:59Z");
  if (entity_type) auditQuery = auditQuery.eq("entity_type", entity_type);
  if (actor_type) auditQuery = auditQuery.eq("actor_type", actor_type);
  const { data: auditRows } = await auditQuery;

  const auditQs = new URLSearchParams();
  if (from) auditQs.set("from", from);
  if (to) auditQs.set("to", to);
  if (entity_type) auditQs.set("entity_type", entity_type);
  if (actor_type) auditQs.set("actor_type", actor_type);
  const auditQsString = auditQs.toString() ? `&${auditQs.toString()}` : "";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div>
        <h1 className="mt-1 text-3xl font-bold">Reports &amp; exports</h1>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Data exports</h2>
        <p className="mt-1 text-sm text-[#5b6a62]">Download any dataset as CSV or Excel.</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <table className="w-full text-sm">
            <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#5b6a62]">
              <tr>
                <th className="p-3 font-medium">Dataset</th>
                <th className="p-3 font-medium">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dbe7e0]">
              {(Object.keys(DATASETS) as DatasetName[]).map((name) => {
                const label = DATASETS[name].label;
                return (
                  <tr key={name}>
                    <td className="p-3">{label}</td>
                    <td className="p-3">
                      <a
                        className="text-[#198038] underline"
                        href={`/api/export/${name}?format=csv`}
                        aria-label={`Download ${label} as CSV`}
                      >
                        CSV
                      </a>
                      <span className="px-2 text-[#7a8a81]">·</span>
                      <a
                        className="text-[#198038] underline"
                        href={`/api/export/${name}?format=xlsx`}
                        aria-label={`Download ${label} as Excel`}
                      >
                        Excel
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Audit report</h2>
        <form method="GET" className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2 text-[#5b6a62]">
            From
            <DatePicker name="from" aria-label="From date" defaultValue={from ?? ""} className="w-40" />
          </div>
          <div className="flex items-center gap-2 text-[#5b6a62]">
            To
            <DatePicker name="to" aria-label="To date" defaultValue={to ?? ""} className="w-40" />
          </div>
          <input type="text" name="entity_type" placeholder="Entity type" aria-label="Entity type" defaultValue={entity_type ?? ""}
            className="rounded-lg border border-[#dbe7e0] bg-white px-1 py-0.5 focus:border-[#198038] focus:outline-none" />
          <input type="text" name="actor_type" placeholder="Actor type" aria-label="Actor type" defaultValue={actor_type ?? ""}
            className="rounded-lg border border-[#dbe7e0] bg-white px-1 py-0.5 focus:border-[#198038] focus:outline-none" />
          <button type="submit" className="rounded-full bg-[#0c6e4f] px-3 py-1.5 text-white hover:bg-[#0a5c42]">Filter</button>
        </form>

        <div className="mt-4 flex gap-4 text-sm">
          <a className="text-[#198038] underline" href={`/api/export/audit?format=csv${auditQsString}`}>Download filtered audit (CSV)</a>
          <a className="text-[#198038] underline" href={`/api/export/audit?format=xlsx${auditQsString}`}>Download filtered audit (Excel)</a>
        </div>

        {auditRows && auditRows.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#5b6a62]">
                <tr>
                  <th className="p-3 font-medium">When</th>
                  <th className="p-3 font-medium">Actor</th>
                  <th className="p-3 font-medium">Action</th>
                  <th className="p-3 font-medium">Entity</th>
                  <th className="p-3 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbe7e0]">
                {auditRows.map((a) => (
                  <tr key={String(a.id)}>
                    <td className="p-3">{formatDate(a.occurred_at as string)}</td>
                    <td className="p-3">{a.actor_type as string}</td>
                    <td className="p-3">{a.action as string}</td>
                    <td className="p-3 text-[#5b6a62]">{a.entity_type as string}</td>
                    <td className="p-3 text-[#5b6a62]">{(a.summary as string) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#5b6a62]">No audit entries match.</p>
        )}
      </section>
    </main>
  );
}
