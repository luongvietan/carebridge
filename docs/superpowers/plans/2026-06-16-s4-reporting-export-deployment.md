# S4 — Reporting, Export, Testing, Deployment & Handover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship admin-only CSV/XLSX export of every key dataset (the Founder's #1 priority), an admin reports + audit page, a cross-browser/mobile Playwright matrix, and production deployment under CareBridge Connect Ltd with backups and handover docs.

**Architecture:** Four new `v_export_*` views complete export coverage; pure serialiser functions (`toCsv`, `toXlsx`) turn view rows into downloads; a paginated `fetchAllPages` helper overcomes PostgREST's `max_rows = 1000` cap so exports are complete; one admin-gated dynamic route streams any dataset; a reports page links to it. Playwright: **chromium runs the full S0–S3 PDF journey suite**; firefox/webkit/mobile projects run **lightweight matrix smoke specs only** (cross-browser coverage without duplicating heavy flows). Deployment is a documented, executed runbook against a fresh production Supabase + Vercel project.

**Tech Stack:** Next.js 16 route handlers, `exceljs`, a hand-rolled RFC-4180 CSV writer, Playwright multi-project, Supabase, Vercel, Resend, Stripe.

**Conventions (verified against the codebase):**
- Admin gate: `import { requireAdmin } from "@/lib/auth/admin"` — returns the caller's user id or `null`.
- Service (RLS-bypassing) client: `import { createServiceClient } from "@/lib/supabase/service"`.
- Admin pages set `export const dynamic = "force-dynamic"` and `redirect("/login")` on guard failure.
- Web app lives in `apps/web`; run `npm` commands there. pgTAP tests live in `supabase/tests/`; migrations in `supabase/migrations/`.
- Per project memory: `npx supabase db push` every new migration to the hosted dev project without asking.
- PostgREST row cap: `supabase/config.toml` sets `max_rows = 1000` (hosted Supabase has the same default). Export queries must paginate with `.range()` — a single `.select()` silently truncates.

---

## Task 1: Export views migration (`v_export_clients/organisations/assessments/payouts`)

**Files:**
- Create: `supabase/migrations/0030_export_views.sql`
- Create: `supabase/tests/0030_export_views_test.sql`

- [ ] **Step 1: Write the failing pgTAP test**

`supabase/tests/0030_export_views_test.sql`:
```sql
begin;
select plan(8);

select has_view('v_export_clients');
select has_view('v_export_organisations');
select has_view('v_export_assessments');
select has_view('v_export_payouts');

select has_column('v_export_clients', 'email_contact');
select has_column('v_export_organisations', 'cqc_registration_number');
select has_column('v_export_assessments', 'passed');
select has_column('v_export_payouts', 'amount');

select * from finish();
rollback;
```

- [ ] **Step 2: Run and verify it fails**

Run: `npx supabase db reset && npx supabase test db`
Expected: FAIL — `0030_export_views_test.sql` errors with `relation "v_export_clients" does not exist` (the migration doesn't exist yet).

- [ ] **Step 3: Write the migration**

`supabase/migrations/0030_export_views.sql`:
```sql
-- S4: complete export coverage. Encrypted bank details and stripe_customer_id are
-- deliberately excluded. Plain views; the export endpoint reads them via the service
-- role and the app layer enforces admin-only access (mirrors 0014_content_views.sql).

create view v_export_clients as
select id, full_name, phone, email_contact, city, postcode, created_at
from private_clients;

create view v_export_organisations as
select id, organisation_name, contact_person, phone, email_contact,
       city, postcode, cqc_registration_number, billing_email, created_at
from organisations;

create view v_export_assessments as
select aa.id, p.full_name, r.name as role, aa.attempt_number,
       aa.score, aa.passed, aa.started_at, aa.completed_at
from assessment_attempts aa
join professionals p on p.id = aa.professional_id
left join professional_roles r on r.id = p.professional_role_id;

create view v_export_payouts as
select po.id, p.full_name, po.booking_id, po.amount, po.currency,
       po.status, po.method, po.reference, po.recorded_at, po.paid_at
from payouts po
join professionals p on p.id = po.professional_id;
```

- [ ] **Step 4: Run and verify it passes**

Run: `npx supabase db reset && npx supabase test db`
Expected: PASS — all pgTAP files green, including the 8 new assertions.

- [ ] **Step 5: Push to hosted dev (per project memory)**

Run: `npx supabase db push`
Expected: `0030_export_views.sql` applied to the hosted dev project.

- [ ] **Step 6: Regenerate Supabase types so the new views are known to the client**

Run (from `apps/web`, per the project's documented Windows workaround):
```
SUPABASE_ACCESS_TOKEN=dummy npx supabase gen types typescript --db-url postgresql://postgres:postgres@127.0.0.1:54321/postgres > src/lib/supabase/types.ts
```
Expected: `src/lib/supabase/types.ts` now contains `v_export_clients`, `v_export_organisations`, `v_export_assessments`, `v_export_payouts`.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/0030_export_views.sql supabase/tests/0030_export_views_test.sql apps/web/src/lib/supabase/types.ts
git commit -m "feat(db): export views for clients, organisations, assessments, payouts"
```

---

## Task 2: CSV + XLSX serialisers

**Files:**
- Create: `apps/web/src/lib/export/csv.ts`
- Create: `apps/web/src/lib/export/csv.test.ts`
- Create: `apps/web/src/lib/export/xlsx.ts`
- Create: `apps/web/src/lib/export/xlsx.test.ts`

- [ ] **Step 1: Add the `exceljs` dependency**

Run (from repo root): `npm install exceljs -w @carebridge/web`
Expected: `exceljs` added to `apps/web/package.json` dependencies (it ships its own types).

- [ ] **Step 2: Write the failing tests**

`apps/web/src/lib/export/csv.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("quotes commas, quotes and newlines (RFC-4180, CRLF)", () => {
    expect(toCsv([{ a: "x,y", b: 'he said "hi"' }])).toBe(
      'a,b\r\n"x,y","he said ""hi"""',
    );
  });

  it("emits a header row even with no data", () => {
    expect(toCsv([], ["a", "b"])).toBe("a,b\r\n");
  });

  it("renders null/undefined as empty fields", () => {
    expect(toCsv([{ a: null, b: undefined }], ["a", "b"])).toBe("a,b\r\n,");
  });

  it("quotes fields containing newlines", () => {
    expect(toCsv([{ a: "line1\nline2" }], ["a"])).toBe('a\r\n"line1\nline2"');
  });
});
```

`apps/web/src/lib/export/xlsx.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { toXlsx } from "./xlsx";

describe("toXlsx", () => {
  it("returns a non-empty buffer with the zip magic bytes", async () => {
    const buf = await toXlsx([{ a: 1, b: 2 }], ["a", "b"]);
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  });
});
```

- [ ] **Step 3: Run and verify they fail**

Run (from `apps/web`): `npm run test`
Expected: FAIL — `Cannot find module './csv'` / `'./xlsx'`.

- [ ] **Step 4: Implement the serialisers**

`apps/web/src/lib/export/csv.ts`:
```ts
/** Serialise rows to an RFC-4180 CSV string (CRLF). Always emits a header row. */
export function toCsv(
  rows: Record<string, unknown>[],
  headers?: string[],
): string {
  const cols = headers ?? (rows[0] ? Object.keys(rows[0]) : []);
  const esc = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  let out = cols.map(esc).join(",") + "\r\n";
  out += rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\r\n");
  return out;
}
```

`apps/web/src/lib/export/xlsx.ts`:
```ts
import ExcelJS from "exceljs";

/** Serialise rows to a single-sheet XLSX workbook buffer. */
export async function toXlsx(
  rows: Record<string, unknown>[],
  headers?: string[],
): Promise<Buffer> {
  const cols = headers ?? (rows[0] ? Object.keys(rows[0]) : []);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Export");
  ws.addRow(cols);
  for (const r of rows) {
    ws.addRow(cols.map((c) => (r[c] == null ? "" : (r[c] as ExcelJS.CellValue))));
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
```

- [ ] **Step 5: Run and verify they pass**

Run (from `apps/web`): `npm run test`
Expected: PASS — all csv/xlsx tests green.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/export/csv.ts apps/web/src/lib/export/csv.test.ts apps/web/src/lib/export/xlsx.ts apps/web/src/lib/export/xlsx.test.ts apps/web/package.json package-lock.json
git commit -m "feat(app): RFC-4180 CSV and XLSX serialisers"
```

---

## Task 3: Dataset registry

**Files:**
- Create: `apps/web/src/lib/export/datasets.ts`
- Create: `apps/web/src/lib/export/datasets.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/export/datasets.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { DATASETS, type DatasetName } from "./datasets";

describe("DATASETS", () => {
  it("covers all nine export datasets", () => {
    expect(Object.keys(DATASETS).sort()).toEqual(
      [
        "assessments",
        "audit",
        "bookings",
        "clients",
        "compliance",
        "organisations",
        "payments",
        "payouts",
        "professionals",
      ].sort(),
    );
  });

  it("maps every dataset to a v_export_ view with non-empty columns", () => {
    for (const name of Object.keys(DATASETS) as DatasetName[]) {
      expect(DATASETS[name].view).toMatch(/^v_export_/);
      expect(DATASETS[name].columns.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run and verify it fails**

Run (from `apps/web`): `npm run test`
Expected: FAIL — `Cannot find module './datasets'`.

- [ ] **Step 3: Implement the registry**

`apps/web/src/lib/export/datasets.ts` (column lists match the view definitions exactly):
```ts
export type DatasetName =
  | "professionals"
  | "clients"
  | "organisations"
  | "bookings"
  | "assessments"
  | "compliance"
  | "payments"
  | "payouts"
  | "audit";

export type Dataset = { view: string; label: string; columns: string[] };

export const DATASETS: Record<DatasetName, Dataset> = {
  professionals: {
    view: "v_export_professionals",
    label: "Professionals",
    columns: ["id", "full_name", "role", "professional_status", "compliance_status",
      "can_accept_bookings", "city", "postcode", "employment_status", "created_at"],
  },
  clients: {
    view: "v_export_clients",
    label: "Private clients",
    columns: ["id", "full_name", "phone", "email_contact", "city", "postcode", "created_at"],
  },
  organisations: {
    view: "v_export_organisations",
    label: "Organisations",
    columns: ["id", "organisation_name", "contact_person", "phone", "email_contact",
      "city", "postcode", "cqc_registration_number", "billing_email", "created_at"],
  },
  bookings: {
    view: "v_export_bookings",
    label: "Bookings",
    columns: ["id", "status", "booking_type", "role", "scheduled_start", "scheduled_end",
      "duration_hours", "location_address", "location_postcode", "total_client_charge",
      "total_payout", "platform_revenue", "snap_currency", "created_at"],
  },
  assessments: {
    view: "v_export_assessments",
    label: "Assessments",
    columns: ["id", "full_name", "role", "attempt_number", "score", "passed",
      "started_at", "completed_at"],
  },
  compliance: {
    view: "v_export_compliance",
    label: "Compliance documents",
    columns: ["id", "full_name", "document_type", "is_compliance_critical",
      "verification_status", "issued_date", "expiry_date", "reference_number", "issuing_body"],
  },
  payments: {
    view: "v_export_payments",
    label: "Payments",
    columns: ["id", "booking_id", "amount", "currency", "status", "paid_at", "created_at"],
  },
  payouts: {
    view: "v_export_payouts",
    label: "Payouts",
    columns: ["id", "full_name", "booking_id", "amount", "currency", "status",
      "method", "reference", "recorded_at", "paid_at"],
  },
  audit: {
    view: "v_export_audit",
    label: "Audit log",
    columns: ["id", "occurred_at", "actor_type", "action", "entity_type", "entity_id", "summary"],
  },
};
```

- [ ] **Step 4: Run and verify it passes**

Run (from `apps/web`): `npm run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/export/datasets.ts apps/web/src/lib/export/datasets.test.ts
git commit -m "feat(app): export dataset registry mapping names to views and columns"
```

---

## Task 4: Paginated fetch helper + admin-gated export endpoint

**Files:**
- Create: `apps/web/src/lib/export/fetch-all-rows.ts`
- Create: `apps/web/src/lib/export/fetch-all-rows.test.ts`
- Create: `apps/web/src/app/api/export/[entity]/route.ts`

- [ ] **Step 1: Write the failing pagination helper test**

`apps/web/src/lib/export/fetch-all-rows.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { EXPORT_PAGE_SIZE, fetchAllPages } from "./fetch-all-rows";

describe("fetchAllPages", () => {
  it("concatenates multiple pages until a short page", async () => {
    const pages = [
      Array.from({ length: EXPORT_PAGE_SIZE }, (_, i) => ({ id: i })),
      [{ id: EXPORT_PAGE_SIZE }],
    ];
    let call = 0;
    const { rows, error } = await fetchAllPages(async (from, to) => {
      const data = pages[call++] ?? [];
      expect(from).toBe(call === 1 ? 0 : EXPORT_PAGE_SIZE);
      expect(to).toBe(call === 1 ? EXPORT_PAGE_SIZE - 1 : EXPORT_PAGE_SIZE + EXPORT_PAGE_SIZE - 1);
      return { data, error: null };
    });
    expect(error).toBeNull();
    expect(rows.length).toBe(EXPORT_PAGE_SIZE + 1);
  });

  it("returns an empty array when the first page is empty", async () => {
    const { rows, error } = await fetchAllPages(async () => ({ data: [], error: null }));
    expect(error).toBeNull();
    expect(rows).toEqual([]);
  });
});
```

- [ ] **Step 2: Run and verify it fails**

Run (from `apps/web`): `npm run test`
Expected: FAIL — `Cannot find module './fetch-all-rows'`.

- [ ] **Step 3: Implement the pagination helper**

`apps/web/src/lib/export/fetch-all-rows.ts`:
```ts
/** Matches `max_rows` in `supabase/config.toml` and hosted Supabase defaults. */
export const EXPORT_PAGE_SIZE = 1000;

/** Fetch every row from a paginated PostgREST query (`.range(from, to)`). */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>,
): Promise<{ rows: T[]; error: unknown }> {
  const rows: T[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await fetchPage(offset, offset + EXPORT_PAGE_SIZE - 1);
    if (error) return { rows: [], error };
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < EXPORT_PAGE_SIZE) break;
    offset += EXPORT_PAGE_SIZE;
  }
  return { rows, error: null };
}
```

- [ ] **Step 4: Run and verify helper tests pass**

Run (from `apps/web`): `npm run test`
Expected: PASS — `fetch-all-rows` tests green.

- [ ] **Step 5: Implement the route handler**

`apps/web/src/app/api/export/[entity]/route.ts`:
```ts
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
    // Fresh query per page — the runtime relation is `dataset.view`; the literal cast
    // only satisfies the typed client (v_export_audit carries every audit filter column).
    let q = admin.from(dataset.view as "v_export_audit").select(dataset.columns.join(","));
    if (entity === "audit") {
      if (from) q = q.gte("occurred_at", from);
      if (to) q = q.lte("occurred_at", to + "T23:59:59Z");
      if (entityType) q = q.eq("entity_type", entityType);
      if (actorType) q = q.eq("actor_type", actorType);
    }
    const { data, error: pageError } = await q.range(pageFrom, pageTo);
    return { data: (data ?? []) as Record<string, unknown>[], error: pageError };
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
```

- [ ] **Step 6: Verify it type-checks and builds**

Run (from `apps/web`): `npm run lint && npm run build`
Expected: PASS — no type or lint errors. (Admin-gating, pagination, and downloads are exercised by unit + E2E tests in Task 6.)

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/export/fetch-all-rows.ts apps/web/src/lib/export/fetch-all-rows.test.ts apps/web/src/app/api/export/[entity]/route.ts
git commit -m "feat(app): paginated admin-gated CSV/XLSX export endpoint"
```

---

## Task 5: Admin reports page + nav link

**Files:**
- Create: `apps/web/src/app/admin/reports/page.tsx`
- Modify: `apps/web/src/lib/auth/role-nav.ts` (add the Reports link)

- [ ] **Step 1: Add the nav link**

In `apps/web/src/lib/auth/role-nav.ts`, add **one** new entry to the `admin` array immediately after the existing Finance line (do not duplicate Finance):
```ts
    { href: "/admin/reports", label: "Reports" },
```

- [ ] **Step 2: Implement the reports page**

`apps/web/src/app/admin/reports/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { DATASETS, type DatasetName } from "@/lib/export/datasets";

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

  // Audit preview (most recent 50 matching rows).
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
        <p className="text-sm tracking-wide text-[#525252] uppercase">Admin</p>
        <h1 className="mt-1 text-3xl font-light">Reports &amp; exports</h1>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-light">Data exports</h2>
        <p className="mt-1 text-sm text-[#525252]">Download any dataset as CSV or Excel.</p>
        <div className="mt-4 overflow-x-auto border border-[#e0e0e0]">
          <table className="w-full text-sm">
            <thead className="border-b border-[#e0e0e0] bg-[#f4f4f4] text-left">
              <tr>
                <th className="p-3 font-medium">Dataset</th>
                <th className="p-3 font-medium">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {(Object.keys(DATASETS) as DatasetName[]).map((name) => (
                <tr key={name}>
                  <td className="p-3">{DATASETS[name].label}</td>
                  <td className="p-3">
                    <a className="text-[#198038] underline" href={`/api/export/${name}?format=csv`}>CSV</a>
                    <span className="px-2 text-[#8c8c8c]">·</span>
                    <a className="text-[#198038] underline" href={`/api/export/${name}?format=xlsx`}>Excel</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-light">Audit report</h2>
        <form method="GET" className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-1 text-[#525252]">
            From<input type="date" name="from" defaultValue={from ?? ""}
              className="ml-1 border-b border-[#8c8c8c] bg-transparent px-1 py-0.5 focus:border-[#198038] focus:outline-none" />
          </label>
          <label className="flex items-center gap-1 text-[#525252]">
            To<input type="date" name="to" defaultValue={to ?? ""}
              className="ml-1 border-b border-[#8c8c8c] bg-transparent px-1 py-0.5 focus:border-[#198038] focus:outline-none" />
          </label>
          <input type="text" name="entity_type" placeholder="Entity type" defaultValue={entity_type ?? ""}
            className="border-b border-[#8c8c8c] bg-transparent px-1 py-0.5 focus:border-[#198038] focus:outline-none" />
          <input type="text" name="actor_type" placeholder="Actor type" defaultValue={actor_type ?? ""}
            className="border-b border-[#8c8c8c] bg-transparent px-1 py-0.5 focus:border-[#198038] focus:outline-none" />
          <button type="submit" className="bg-[#198038] px-3 py-1.5 text-white hover:bg-[#0e6027]">Filter</button>
        </form>

        <div className="mt-4 flex gap-4 text-sm">
          <a className="text-[#198038] underline" href={`/api/export/audit?format=csv${auditQsString}`}>Download filtered audit (CSV)</a>
          <a className="text-[#198038] underline" href={`/api/export/audit?format=xlsx${auditQsString}`}>Download filtered audit (Excel)</a>
        </div>

        {auditRows && auditRows.length > 0 ? (
          <div className="mt-4 overflow-x-auto border border-[#e0e0e0]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#e0e0e0] bg-[#f4f4f4] text-left">
                <tr>
                  <th className="p-3 font-medium">When</th>
                  <th className="p-3 font-medium">Actor</th>
                  <th className="p-3 font-medium">Action</th>
                  <th className="p-3 font-medium">Entity</th>
                  <th className="p-3 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {auditRows.map((a) => (
                  <tr key={a.id as string}>
                    <td className="p-3">{formatDate(a.occurred_at as string)}</td>
                    <td className="p-3">{a.actor_type as string}</td>
                    <td className="p-3">{a.action as string}</td>
                    <td className="p-3 text-[#525252]">{a.entity_type as string}</td>
                    <td className="p-3 text-[#525252]">{(a.summary as string) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#525252]">No audit entries match.</p>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Verify it builds**

Run (from `apps/web`): `npm run lint && npm run build`
Expected: PASS — `/admin/reports` compiles; the Reports nav link is present.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/admin/reports/page.tsx apps/web/src/lib/auth/role-nav.ts
git commit -m "feat(app): admin reports page with dataset exports and audit report"
```

---

## Task 6: Cross-browser + mobile test matrix

> **Scope (aligned with design spec):** Chromium runs the **full PDF journey suite** already authored in S0–S3 (`auth`, `onboarding`, `bookings`, `payments-admin`, `admin-governance`). Firefox, WebKit, and mobile viewports run **matrix smoke specs only** — public/login render, export 403, one admin CSV download. This satisfies cross-browser/mobile coverage without multiplying heavy seeded flows five times.

**Files:**
- Modify: `apps/web/playwright.config.ts` (add projects + HTML reporter)
- Create: `apps/web/e2e/matrix/smoke.spec.ts`

- [ ] **Step 1: Install the additional browsers**

Run (from `apps/web`): `npx playwright install firefox webkit chromium`
Expected: firefox, webkit, chromium binaries installed.

- [ ] **Step 2: Add Playwright projects and HTML reporter**

In `apps/web/playwright.config.ts`:

1. Replace `reporter: "list"` with (so CI can upload a useful artifact in Task 7):
```ts
  reporter: [["list"], ["html", { open: "never" }]],
```

2. Replace the `projects: [...]` line (currently `projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],`) with:
```ts
  projects: [
    // Chromium runs the full suite (S0–S3 journeys + matrix smoke specs).
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Other browsers/viewports run only the lightweight matrix smoke specs.
    { name: "firefox", use: { ...devices["Desktop Firefox"] }, testMatch: /matrix[\\/].*\.spec\.ts/ },
    { name: "webkit", use: { ...devices["Desktop Safari"] }, testMatch: /matrix[\\/].*\.spec\.ts/ },
    { name: "Mobile Chrome", use: { ...devices["Pixel 7"] }, testMatch: /matrix[\\/].*\.spec\.ts/ },
    { name: "Mobile Safari", use: { ...devices["iPhone 14"] }, testMatch: /matrix[\\/].*\.spec\.ts/ },
  ],
```
Also raise the global `timeout` if needed (leave at `90_000`).

- [ ] **Step 3: Write the matrix smoke spec**

`apps/web/e2e/matrix/smoke.spec.ts`:
```ts
import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PASSWORD = "password123";

function service(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function seedAdmin(sb: SupabaseClient, stamp: number) {
  const email = `matrixadmin_${stamp}@test.dev`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { account_type: "admin", full_name: "Matrix E2E Admin" },
  });
  if (error || !data.user) throw error ?? new Error("admin user");
  return { email, userId: data.user.id };
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
}

test("public landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("h1").first()).toBeVisible();
});

test("login form renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

test("export endpoint rejects an unauthenticated request", async ({ request }) => {
  const res = await request.get("/api/export/bookings?format=csv");
  expect(res.status()).toBe(403);
});

test("admin downloads a CSV export from the reports page", async ({ page }) => {
  const sb = service();
  const admin = await seedAdmin(sb, Date.now());
  try {
    await login(page, admin.email);
    await page.goto("/admin/reports");
    await expect(page.getByRole("heading", { name: /reports & exports/i })).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "CSV" }).first().click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^carebridge-.*\.csv$/);
  } finally {
    await sb.auth.admin.deleteUser(admin.userId);
  }
});
```

- [ ] **Step 4: Run the full matrix and fix any responsive failures**

Run (from `apps/web`, with local Supabase up — `npx supabase start` first): `npm run e2e`
Expected: PASS across all 5 projects. Chromium runs the full S0–S3 journey suite plus matrix smoke; firefox/webkit/mobile run matrix smoke only. Fix any mobile-viewport rendering issues surfaced.

- [ ] **Step 5: Commit**

```bash
git add apps/web/playwright.config.ts apps/web/e2e/matrix/smoke.spec.ts
git commit -m "test(app): cross-browser and mobile E2E smoke matrix"
```

---

## Task 7: CI extension (chromium-only E2E + report artifact)

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Pin E2E to chromium and upload the report**

In `.github/workflows/ci.yml`, change the E2E step to run chromium only and add an artifact upload. Replace the `- name: E2E (local Supabase)` step with:
```yaml
      - name: E2E (local Supabase, chromium)
        run: npm run e2e -- --project=chromium
        working-directory: apps/web
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
          SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: apps/web/playwright-report/
          retention-days: 7
```
(Keep the existing `npm ci`, Supabase start/reset/pgTAP, lint, test, build, and `npx playwright install --with-deps chromium` steps unchanged. The HTML reporter is configured in Task 6 — `apps/web/playwright-report/` will contain the artifact.)

- [ ] **Step 2: Verify the workflow is valid YAML**

Run: `npx --yes js-yaml .github/workflows/ci.yml > NUL`
Expected: no parse error (command exits 0).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: run chromium E2E and publish the Playwright report"
```

---

## Task 8: Production deployment runbook (executed)

**Files:**
- Create: `docs/DEPLOYMENT.md`

> Some steps are dashboard actions performed with Ana's credentials. Write the runbook as you execute it; capture the actual project refs/URLs used.

- [ ] **Step 1: Write `docs/DEPLOYMENT.md` with the production runbook**

Include, as numbered runnable steps:
- **Production Supabase project:** create the project under CareBridge Connect Ltd; record its ref. Link the repo: `npx supabase link --project-ref <PROD_REF>`. Apply all migrations: `npx supabase db push`. Load reference/compliance/assessment seeds: run `supabase/seed.sql` against the prod DB (`psql "<PROD_DB_URL>" -f supabase/seed.sql`). Verify counts (`assessment_question_bank`, `compliance_requirements`) via the REST API or SQL editor.
- **First admin (founder) user:** create Ana's account in the prod Auth dashboard with `user_metadata` `{ "account_type": "admin", "full_name": "Ana ..." }` (the `handle_new_user` trigger provisions the `users` row with `account_type` only — it does **not** copy `is_founder` from metadata). Then run in the SQL editor: `UPDATE users SET is_founder = true WHERE email = '<ana@...>';` if founder flag is required on the row. Confirm she can sign in and reach `/admin`.
- **Encryption key:** generate a **stable** production `PAYOUT_ENC_KEY` (e.g. `openssl rand -base64 32`) and store it in the secrets manager — document that rotating it breaks stored bank details.
- **Vercel project:** create under CareBridge Connect Ltd, root `apps/web`. Set env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (prod), `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET` (from the live webhook, below), `PAYOUT_ENC_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL` (the production URL).
- **Domain + SSL:** add the custom domain in Vercel, point DNS, verify the certificate is issued.
- **Supabase Auth:** set `site_url` and redirect URLs to the production domain; configure Resend SMTP for transactional auth emails.
- **Live Stripe webhook:** create an endpoint → `https://<domain>/api/stripe/webhook` for these events (mapped in `lib/stripe/events.ts`): `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
- **Key rotation:** rotate the dev service-role key that was shared in chat; update `.env.local` and any local tooling.
- **Smoke check:** load the production URL, sign in as Ana, open `/admin/reports`, download one CSV export.

- [ ] **Step 2: Commit**

```bash
git add docs/DEPLOYMENT.md
git commit -m "docs: production deployment runbook"
```

---

## Task 9: Backups + restore drill

**Files:**
- Modify: `docs/DEPLOYMENT.md` (append a Backups section)

- [ ] **Step 1: Enable backups and verify the compliance sweep**

In the prod Supabase project, enable daily backups / PITR (the project plan supports it). The `pg_cron` compliance sweep is scheduled automatically when migration `0015_compliance_engine.sql` runs on hosted Supabase — **do not schedule it again** (duplicate jobs). Verify in the SQL editor: `SELECT jobid, jobname, schedule FROM cron.job WHERE jobname = 'compliance-sweep-daily';` — expect one row at `0 2 * * *`.

- [ ] **Step 2: Perform a restore drill and document it**

Restore the latest backup into a scratch project; verify a known row (e.g. a seeded `compliance_requirements` count) survives. Append to `docs/DEPLOYMENT.md` a "Backups & restore" section with: backup schedule/retention, the exact restore procedure, and the drill result/date.

- [ ] **Step 3: Commit**

```bash
git add docs/DEPLOYMENT.md
git commit -m "docs: backup schedule and restore drill procedure"
```

---

## Task 10: User guide + handover docs

**Files:**
- Create: `docs/USER_GUIDE.md`
- Create: `docs/HANDOVER.md`

- [ ] **Step 1: Write `docs/USER_GUIDE.md`**

Cover admin flows (approve professionals, review documents at `/admin/compliance`, manage bookings at `/admin/bookings`, amend rates at `/admin/rates`, record payouts at `/admin/finance/payouts`, run exports at `/admin/reports`) and a short walkthrough per role (professional onboarding/assessment, client/org registration + booking).

- [ ] **Step 2: Write `docs/HANDOVER.md`**

Ownership-transfer checklist (PDF §13–14, §17): transfer of the GitHub repo, Vercel project, Supabase project, Stripe account, domain registrar, and Resend account to CareBridge Connect Ltd; founder admin access confirmed; environment-variable inventory (names only, values in the client's secret store); source-code handover sign-off.

- [ ] **Step 3: Commit**

```bash
git add docs/USER_GUIDE.md docs/HANDOVER.md
git commit -m "docs: admin user guide and ownership handover checklist"
```

---

## Test strategy

- **Unit (vitest):** `toCsv` quoting/CRLF/newlines/empty-with-headers + null handling; `toXlsx` zip magic; `DATASETS` coverage and shape; `fetchAllPages` multi-page concatenation.
- **DB (pgTAP):** the four new export views exist with key columns (`0030_export_views_test.sql`).
- **E2E (Playwright):**
  - **Chromium (full PDF journeys):** existing S0–S3 specs (`auth`, `onboarding`, `bookings`, `payments-admin`, `admin-governance`).
  - **Matrix smoke (all 5 projects):** unauthenticated export → 403; admin CSV download from `/admin/reports`; public + login pages render across Chromium/Firefox/WebKit/Pixel 7/iPhone 14.
- **Manual:** restore-from-backup drill.

## Acceptance

All nine datasets export to CSV and XLSX with **complete row coverage** (paginated past the 1000-row PostgREST cap), admin-only (non-admin → 403); the audit report filters and exports; `npm run test`, `npx supabase test db`, `npm run e2e` (5 projects — chromium full suite + matrix smoke on all browsers), `npm run lint`, and `npm run build` all pass; CI runs chromium E2E and publishes an HTML Playwright report artifact; the app is live on the owned domain with SSL, daily backups verified by a restore drill, ownership transferred, and `USER_GUIDE.md` / `HANDOVER.md` / `DEPLOYMENT.md` delivered.

## Self-review notes

- **Spec coverage:** §1 views → T1; §2 serialisers → T2; §3 registry+endpoint → T3+T4; §4 reports page → T5; §5 test matrix → T6; §6 CI → T7; §7 deployment → T8; §8 backups → T9; §9 handover → T10. All mapped.
- **Type consistency:** `DatasetName`/`DATASETS` shape is identical across T3/T4/T5; `toCsv`/`toXlsx` signatures match their call sites; registry column lists match the view column lists in `0014` and `0030`.
- **Export completeness:** `fetchAllPages` + `EXPORT_PAGE_SIZE = 1000` addresses PostgREST truncation (`supabase/config.toml` `max_rows`).
- **Test matrix scope:** chromium = full PDF journeys (S0–S3); other projects = matrix smoke only — documented in T6 and aligned with design intent.
- **CI artifact:** HTML reporter configured in T6 so Task 7 upload is non-empty.
- **Ops accuracy:** founder `is_founder` flag set via SQL (trigger gap); pg_cron verified not re-scheduled; Stripe webhook events listed explicitly.
- **No placeholders:** every code step carries complete code; ops tasks (T8–T10) produce concrete committable docs with the exact commands/contents to capture.
