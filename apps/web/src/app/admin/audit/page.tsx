import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { formatLondon, londonDateRangeToUtc } from "@/lib/format/datetime";
import { Select } from "@/components/ui/select";

export const dynamic = "force-dynamic";

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
  if (!(await requireAdmin())) redirect("/login");

  const params = await searchParams;
  const from = pick(params, "from");
  const to = pick(params, "to");
  const entityType = pick(params, "entityType");
  const entityTypeFilter = entityType && ENTITY_TYPES.includes(entityType) ? entityType : undefined;
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

  const { data } = await query;
  const rows = data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Audit log</h1>
      <p className="mt-2 text-sm text-[#4a4a4a]">
        Append-only record of registrations, document uploads, assessment completions, approvals,
        payments and administrator actions (spec §16). Showing the most recent {MAX_ROWS} entries.
      </p>

      <form method="GET" className="mt-6 flex flex-wrap items-end gap-4 text-sm">
        <div className="flex flex-col gap-1 text-[#4a4a4a]">
          From
          <input type="date" name="from" defaultValue={from ?? ""} className="rounded-xl border border-[#dbe7e0] px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1 text-[#4a4a4a]">
          To
          <input type="date" name="to" defaultValue={to ?? ""} className="rounded-xl border border-[#dbe7e0] px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1 text-[#4a4a4a]">
          Entity
          <Select
            name="entityType"
            aria-label="Entity type"
            defaultValue={entityTypeFilter ?? ""}
            className="w-52"
            options={[
              { value: "", label: "All entities" },
              ...ENTITY_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") })),
            ]}
          />
        </div>
        <button type="submit" className="rounded-full bg-[#2e7d32] px-4 py-2 text-white hover:bg-[#246627]">
          Apply filter
        </button>
        {(from || to || entityTypeFilter) && (
          <Link href="/admin/audit" className="text-[#2e7d32] hover:underline">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#4a4a4a]">
            <tr>
              <th className="p-3 font-medium">When</th>
              <th className="p-3 font-medium">Actor</th>
              <th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Entity</th>
              <th className="p-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dbe7e0]">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap p-3 text-[#4a4a4a]">{formatLondon(r.occurred_at)}</td>
                <td className="p-3">{r.actor_type}</td>
                <td className="p-3 font-medium">{r.action}</td>
                <td className="p-3 text-[#4a4a4a]">
                  {r.entity_type ?? "—"}
                  {r.entity_id ? <span className="block text-xs text-[#9aa8a0]">{r.entity_id}</span> : null}
                </td>
                <td className="p-3 text-[#4a4a4a]">{r.summary ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-sm text-[#4a4a4a]">No audit entries match these filters.</p>}
      </div>
    </main>
  );
}
