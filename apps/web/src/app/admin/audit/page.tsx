import { getPortalT } from "@/lib/i18n/portal-server";
import { Tr } from "@/components/portal-locale";
import { TableScroll } from "@/components/table-scroll";
import { AdminTableHeader } from "@/components/admin-table-header";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { formatLondon, londonDateRangeToUtc } from "@/lib/format/datetime";
import { Select } from "@/components/ui/select";

export const dynamic = "force-dynamic";

const ACTOR_TYPES = ["user", "admin", "system"];

const MAX_ROWS = 500;

const ENTITY_TYPES = [
  "professional",
  "document",
  "assessment_attempt",
  "booking",
  "payment",
  "payout",
  "user",
];

function pick(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = params[key];
  return typeof v === "string" && v ? v : undefined;
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getPortalT();

  if (!(await requireAdmin())) redirect("/login");

  const params = await searchParams;
  const from = pick(params, "from");
  const to = pick(params, "to");
  const entityType = pick(params, "entityType");
  const entityTypeFilter = entityType && ENTITY_TYPES.includes(entityType) ? entityType : undefined;
  const search = pick(params, "search")?.trim();
  const actorType = pick(params, "actorType");
  const actorTypeFilter = actorType && ACTOR_TYPES.includes(actorType) ? actorType : undefined;
  const { gte, lt } = londonDateRangeToUtc(from, to);

  const admin = createServiceClient();
  let query = admin
    .from("audit_log")
    .select("id, occurred_at, actor_type, action, entity_type, entity_id, summary")
    .order("occurred_at", { ascending: false })
    .limit(MAX_ROWS);
  if (gte) query = query.gte("occurred_at", gte);
  if (lt) query = query.lt("occurred_at", lt);
  if (entityTypeFilter) query = query.eq("entity_type", entityTypeFilter);
  if (actorTypeFilter) query = query.eq("actor_type", actorTypeFilter);
  if (search) {
    // Search covers the action, the free-text summary and the entity id, so a
    // professional's or booking's id pasted straight from a URL finds its trail.
    const pattern = `%${search.replace(/[,()*\\]/g, " ")}%`;
    query = query.or(`action.ilike.${pattern},summary.ilike.${pattern},entity_id.ilike.${pattern}`);
  }

  const { data } = await query;
  const rows = data ?? [];

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold"><Tr>{"Audit log"}</Tr></h1>
      <p className="mt-2 text-sm text-ink"><Tr>{"Append-only record of registrations, document uploads, assessment completions, approvals, payments, administrator actions and sign-ins, including failed attempts (spec §16). Showing the most recent"}</Tr>{MAX_ROWS}<Tr>{"entries."}</Tr></p>

      <form method="GET" className="mt-6 flex flex-wrap items-end gap-4 text-sm">
        <div className="flex flex-col gap-1 text-ink"><Tr>{"From"}</Tr><input type="date" name="from" aria-label={t("From date")} defaultValue={from ?? ""} className="rounded-xl border border-line px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1 text-ink"><Tr>{"To"}</Tr><input type="date" name="to" aria-label={t("To date")} defaultValue={to ?? ""} className="rounded-xl border border-line px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1 text-ink"><Tr>{"Entity"}</Tr><Select
            name="entityType"
            aria-label={t("Entity type")}
            defaultValue={entityTypeFilter ?? ""}
            className="w-52"
            options={[
              { value: "", label: "All entities" },
              ...ENTITY_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") })),
            ]}
          />
        </div>
        <div className="flex flex-col gap-1 text-ink"><Tr>{"Actor"}</Tr><Select
            name="actorType"
            aria-label={t("Actor type")}
            defaultValue={actorTypeFilter ?? ""}
            className="w-40"
            options={[
              { value: "", label: "Anyone" },
              ...ACTOR_TYPES.map((t) => ({ value: t, label: t })),
            ]}
          />
        </div>
        <label className="flex flex-col gap-1 text-ink"><Tr>{"Search"}</Tr><input
            type="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder={t("Action, details, or paste an id")}
            className="w-64 rounded-xl border border-line px-3 py-2"
          />
        </label>
        <button type="submit" className="rounded-full bg-brand-strong px-4 py-2 text-white hover:bg-brand-strong-hover"><Tr>{"Apply filter"}</Tr></button>
        {(from || to || entityTypeFilter || actorTypeFilter || search) && (
          <Link href="/admin/audit" className="text-brand-strong hover:underline"><Tr>{"Clear"}</Tr></Link>
        )}
      </form>

      <TableScroll className="mt-8 rounded-2xl border border-line shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
        <table className="w-full text-sm">
          <AdminTableHeader>
            <tr>
              <th className="p-3 font-medium"><Tr>{"When"}</Tr></th>
              <th className="p-3 font-medium"><Tr>{"Actor"}</Tr></th>
              <th className="p-3 font-medium"><Tr>{"Action"}</Tr></th>
              <th className="p-3 font-medium"><Tr>{"Entity"}</Tr></th>
              <th className="p-3 font-medium"><Tr>{"Details"}</Tr></th>
            </tr>
          </AdminTableHeader>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap p-3 text-ink">{formatLondon(r.occurred_at)}</td>
                <td className="p-3">{r.actor_type}</td>
                <td className="p-3 font-medium">{r.action}</td>
                <td className="p-3 text-ink">
                  {r.entity_type ?? "—"}
                  {r.entity_id ? <span className="block text-xs text-muted">{r.entity_id}</span> : null}
                </td>
                <td className="p-3 text-ink">{r.summary ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-sm text-ink"><Tr>{"No audit entries match these filters."}</Tr></p>}
      </TableScroll>
    </main>
  );
}
