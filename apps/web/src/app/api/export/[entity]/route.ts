import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { DATASETS, type DatasetName } from "@/lib/export/datasets";
import { toCsv } from "@/lib/export/csv";
import { toXlsx } from "@/lib/export/xlsx";
import { fetchAllPages } from "@/lib/export/fetch-all-rows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string }> },
) {
  if (!(await requireAdmin())) return new Response("Forbidden", { status: 403 });

  const { entity } = await params;
  const dataset = DATASETS[entity as DatasetName];
  if (!dataset) return new Response("Unknown dataset", { status: 404 });

  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const entityType = url.searchParams.get("entity_type");
  const actorType = url.searchParams.get("actor_type");

  const admin = createServiceClient();

  const { rows, error } = await fetchAllPages(async (pageFrom, pageTo) => {
    let q = admin
      .from(dataset.view as "v_export_audit")
      .select(dataset.columns.join(","))
      .order(dataset.orderBy.column, { ascending: dataset.orderBy.ascending ?? true })
      // Unique tiebreaker: guarantees a total order so `.range()` pagination never
      // duplicates or skips rows when the primary key has ties (e.g. audit rows that
      // share an identical same-transaction `occurred_at`).
      .order("id", { ascending: true });
    if (entity === "audit") {
      if (from) q = q.gte("occurred_at", from);
      if (to) q = q.lte("occurred_at", to + "T23:59:59Z");
      if (entityType) q = q.eq("entity_type", entityType);
      if (actorType) q = q.eq("actor_type", actorType);
    }
    const { data, error: pageError } = await q.range(pageFrom, pageTo);
    return { data: (data ?? []) as unknown as Record<string, unknown>[], error: pageError };
  });

  if (error) return new Response("Query error", { status: 500 });

  const date = new Date().toISOString().slice(0, 10);
  const filename = `carebridge-${entity}-${date}.${format}`;
  const disposition = `attachment; filename="${filename}"`;

  if (format === "xlsx") {
    const buf = await toXlsx(rows, dataset.columns);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": disposition,
      },
    });
  }

  return new Response(toCsv(rows, dataset.columns), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": disposition,
    },
  });
}
