import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { formatLondon } from "@/lib/format/datetime";
import { ForwardLink } from "@/components/forward-link";
import { OpenIncidentForm, UpdateIncidentForm } from "@/components/incident-forms";

export const dynamic = "force-dynamic";

const SEVERITY_STYLE: Record<string, string> = {
  low: "bg-[#f5f7f6] text-[#4a4a4a]",
  medium: "bg-[#e8f1fb] text-[#0f62fe]",
  high: "bg-[#fcf4d6] text-[#684e1b]",
  critical: "bg-[#fff1f1] text-[#a2191f]",
};

const STATUS_STYLE: Record<string, string> = {
  open: "bg-[#fff1f1] text-[#a2191f]",
  investigating: "bg-[#fcf4d6] text-[#684e1b]",
  resolved: "bg-[#defbe6] text-[#0e6027]",
  closed: "bg-[#f5f7f6] text-[#4a4a4a]",
};

export default async function AdminIncidentsPage() {
  if (!(await requireAdmin())) redirect("/login");
  const admin = createServiceClient();

  const [{ data: incidents }, { data: professionals }] = await Promise.all([
    admin
      .from("incidents")
      .select(
        "id, reference, category, severity, status, subject, details, investigation, outcome, reported_by, raised_at, resolved_at, closed_at, booking_id, professionals(full_name)",
      )
      .order("raised_at", { ascending: false }),
    admin.from("professionals").select("id, full_name").order("full_name"),
  ]);

  const open = (incidents ?? []).filter((i) => i.status === "open" || i.status === "investigating");
  const settled = (incidents ?? []).filter((i) => i.status === "resolved" || i.status === "closed");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Complaints and incidents</h1>
      <p className="mt-2 text-sm text-[#4a4a4a]">
        Concerns raised about a professional, a booking or a client, their investigation and their
        outcome. Visible to administrators only.
      </p>

      <div className="mt-6">
        <OpenIncidentForm
          professionals={(professionals ?? []).map((p) => ({ id: p.id, name: p.full_name }))}
        />
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Open ({open.length})</h2>
        {open.length === 0 ? (
          <p className="mt-3 text-sm text-[#4a4a4a]">Nothing is currently under investigation.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {open.map((incident) => (
              <li key={incident.id} className="rounded-2xl border border-[#dbe7e0] p-4">
                <IncidentHeader incident={incident} />
                <p className="mt-2 text-sm text-[#4a4a4a]">{incident.details}</p>
                <UpdateIncidentForm
                  incident={{
                    id: incident.id,
                    status: incident.status,
                    investigation: incident.investigation,
                    outcome: incident.outcome,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Resolved and closed ({settled.length})</h2>
        {settled.length === 0 ? (
          <p className="mt-3 text-sm text-[#4a4a4a]">Nothing resolved yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {settled.map((incident) => (
              <li key={incident.id} className="rounded-2xl border border-[#dbe7e0] p-4">
                <IncidentHeader incident={incident} />
                {incident.outcome && (
                  <p className="mt-2 text-sm text-[#4a4a4a]">
                    <span className="font-semibold text-[#1e5a33]">Outcome:</span> {incident.outcome}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-sm text-[#4a4a4a]">
        Every concern and every change of status is written to the{" "}
        <ForwardLink href="/admin/audit?search=incident" className="text-[#2e7d32] hover:underline">
          audit log
        </ForwardLink>
        .
      </p>
    </main>
  );
}

type IncidentRow = {
  reference: string;
  category: string;
  severity: string;
  status: string;
  subject: string;
  reported_by: string | null;
  raised_at: string;
  booking_id: string | null;
  professionals: { full_name: string } | unknown;
};

function IncidentHeader({ incident }: { incident: IncidentRow }) {
  const professional = incident.professionals as { full_name: string } | null;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <span className="font-semibold">{incident.subject}</span>
        <span className="ml-2 text-xs text-[#7a8a81]">{incident.reference}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium ${SEVERITY_STYLE[incident.severity]}`}>
          {incident.severity}
        </span>
        <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLE[incident.status]}`}>
          {incident.status}
        </span>
        <span className="text-[#7a8a81]">{incident.category}</span>
        {professional?.full_name && (
          <span className="text-[#7a8a81]">about {professional.full_name}</span>
        )}
        <span className="text-[#7a8a81]">{formatLondon(incident.raised_at)}</span>
        {incident.reported_by && (
          <span className="text-[#7a8a81]">reported by {incident.reported_by}</span>
        )}
      </div>
    </div>
  );
}
