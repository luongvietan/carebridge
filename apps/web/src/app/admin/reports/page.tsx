import { getPortalT } from "@/lib/i18n/portal-server";
import { Tr } from "@/components/portal-locale";
import { TableScroll } from "@/components/table-scroll";
import { AdminTableHeader } from "@/components/admin-table-header";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { DATASETS, type DatasetName } from "@/lib/export/datasets";
import { DatePicker } from "@/components/ui/date-picker";
import { londonDateRangeToUtc } from "@/lib/format/datetime";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; entity_type?: string; actor_type?: string }>;
}) {
  const t = await getPortalT();

  if (!(await requireAdmin())) redirect("/login");
  const { from, to, entity_type, actor_type } = await searchParams;
  const admin = createServiceClient();

  let auditQuery = admin
    .from("v_export_audit")
    .select("id, occurred_at, actor_type, action, entity_type, entity_id, summary")
    .order("occurred_at", { ascending: false })
    .limit(50);
  const { gte, lt } = londonDateRangeToUtc(from, to);
  if (gte) auditQuery = auditQuery.gte("occurred_at", gte);
  if (lt) auditQuery = auditQuery.lt("occurred_at", lt);
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
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10">
      <div>
        <h1 className="mt-1 text-3xl font-bold"><Tr>{"Reports & exports"}</Tr></h1>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-bold"><Tr>{"Data exports"}</Tr></h2>
        <p className="mt-1 text-sm text-ink"><Tr>{"Download any dataset as CSV or Excel."}</Tr></p>
        <TableScroll className="mt-4 rounded-2xl border border-line shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <table className="w-full text-sm">
            <AdminTableHeader>
              <tr>
                <th className="p-3 font-medium"><Tr>{"Dataset"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Download"}</Tr></th>
              </tr>
            </AdminTableHeader>
            <tbody className="divide-y divide-line">
              {(Object.keys(DATASETS) as DatasetName[]).map((name) => {
                const label = DATASETS[name].label;
                return (
                  <tr key={name}>
                    <td className="p-3">{label}</td>
                    <td className="p-3">
                      <a
                        className="text-brand-strong underline"
                        href={`/api/export/${name}?format=csv`}
                        aria-label={`Download ${label} as CSV`}
                      ><Tr>{"CSV"}</Tr></a>
                      <span className="px-2 text-muted">·</span>
                      <a
                        className="text-brand-strong underline"
                        href={`/api/export/${name}?format=xlsx`}
                        aria-label={`Download ${label} as Excel`}
                      ><Tr>{"Excel"}</Tr></a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold"><Tr>{"Audit report"}</Tr></h2>
        <form method="GET" className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2 text-ink"><Tr>{"From"}</Tr><DatePicker name="from" aria-label={t("From date")} defaultValue={from ?? ""} className="w-40" />
          </div>
          <div className="flex items-center gap-2 text-ink"><Tr>{"To"}</Tr><DatePicker name="to" aria-label={t("To date")} defaultValue={to ?? ""} className="w-40" />
          </div>
          <input type="text" name="entity_type" placeholder={t("Entity type")} aria-label={t("Entity type")} defaultValue={entity_type ?? ""}
            className="rounded-lg border border-line bg-white px-1 py-0.5 focus:border-brand-strong focus:outline-none" />
          <input type="text" name="actor_type" placeholder={t("Actor type")} aria-label={t("Actor type")} defaultValue={actor_type ?? ""}
            className="rounded-lg border border-line bg-white px-1 py-0.5 focus:border-brand-strong focus:outline-none" />
          <button type="submit" className="rounded-full bg-brand-strong px-3 py-1.5 text-white hover:bg-brand-strong-hover"><Tr>{"Filter"}</Tr></button>
        </form>

        <div className="mt-4 flex gap-4 text-sm">
          <a className="text-brand-strong underline" href={`/api/export/audit?format=csv${auditQsString}`}><Tr>{"Download filtered audit (CSV)"}</Tr></a>
          <a className="text-brand-strong underline" href={`/api/export/audit?format=xlsx${auditQsString}`}><Tr>{"Download filtered audit (Excel)"}</Tr></a>
        </div>

        {auditRows && auditRows.length > 0 ? (
          <TableScroll className="mt-4 rounded-2xl border border-line shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <table className="w-full text-sm">
              <AdminTableHeader>
                <tr>
                  <th className="p-3 font-medium"><Tr>{"When"}</Tr></th>
                  <th className="p-3 font-medium"><Tr>{"Actor"}</Tr></th>
                  <th className="p-3 font-medium"><Tr>{"Action"}</Tr></th>
                  <th className="p-3 font-medium"><Tr>{"Entity"}</Tr></th>
                  <th className="p-3 font-medium"><Tr>{"Summary"}</Tr></th>
                </tr>
              </AdminTableHeader>
              <tbody className="divide-y divide-line">
                {auditRows.map((a) => (
                  <tr key={String(a.id)}>
                    <td className="p-3">{formatDate(a.occurred_at as string)}</td>
                    <td className="p-3">{a.actor_type as string}</td>
                    <td className="p-3">{a.action as string}</td>
                    <td className="p-3 text-ink">{a.entity_type as string}</td>
                    <td className="p-3 text-ink">{(a.summary as string) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        ) : (
          <p className="mt-3 text-sm text-ink"><Tr>{"No audit entries match."}</Tr></p>
        )}
      </section>
    </main>
  );
}
