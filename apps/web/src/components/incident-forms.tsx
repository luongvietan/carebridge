"use client";
import { RequiredMark } from "@/components/required-mark";
import { Tr } from "@/components/portal-locale";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { openIncident, updateIncident } from "@/lib/admin/incident-actions";

const field =
  "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-brand-ink focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-strong/15";

const CATEGORIES = [
  { value: "complaint", label: "Complaint" },
  { value: "incident", label: "Incident" },
  { value: "safeguarding", label: "Safeguarding concern" },
  { value: "other", label: "Other" },
];

const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export function OpenIncidentForm({
  professionals,
}: {
  professionals: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [professionalId, setProfessionalId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("category", category);
    fd.set("severity", severity);
    fd.set("professionalId", professionalId);
    let result: Awaited<ReturnType<typeof openIncident>>;
    try {
      result = await openIncident(fd);
    } catch {
      setError("Could not complete the operation. Please try again.");
      return;
    } finally {
      setBusy(false);
    }
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-brand-strong px-4 py-2 text-sm text-white hover:bg-brand-strong-hover"
      ><Tr>{"Record a concern"}</Tr></button>
    );
  }

  return (
    <form aria-busy={busy} onSubmit={onSubmit} className="mt-4 rounded-2xl border border-line p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="text-sm font-medium"><Tr>{"Kind"}</Tr><Select
            name="category"
            aria-label="Kind of concern"
            required
            value={category}
            onValueChange={setCategory}
            placeholder="Select…"
            className="mt-1"
            options={CATEGORIES}
          />
        </div>
        <div className="text-sm font-medium"><Tr>{"Severity"}</Tr><Select
            name="severity"
            aria-label="Severity"
            value={severity}
            onValueChange={setSeverity}
            className="mt-1"
            options={SEVERITIES}
          />
        </div>
        <div className="text-sm font-medium"><Tr>{"About (optional)"}</Tr><Select
            name="professionalId"
            aria-label="Professional concerned"
            value={professionalId}
            onValueChange={setProfessionalId}
            placeholder="A professional…"
            className="mt-1"
            options={[
              { value: "", label: "Not about a professional" },
              ...professionals.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>
      </div>

      <label className="mt-3 block text-sm font-medium"><Tr>{"Subject"}</Tr><RequiredMark /><input name="subject" required className={field} placeholder="Short summary" />
      </label>
      <label className="mt-3 block text-sm font-medium"><Tr>{"What was reported"}</Tr><RequiredMark /><textarea name="details" required rows={4} className={field} />
      </label>
      <label className="mt-3 block text-sm font-medium"><Tr>{"Reported by (optional)"}</Tr><input name="reportedBy" className={field} placeholder="Name, and how it reached us" />
      </label>

      {error && <p role="alert" className="mt-2 text-sm text-danger"><Tr>{error}</Tr></p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-brand-strong px-4 py-2 text-sm text-white hover:bg-brand-strong-hover disabled:opacity-50"
        >
          <Tr>{busy ? "Recording…" : "Record concern"}</Tr>
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-surface"
        ><Tr>{"Cancel"}</Tr></button>
      </div>
    </form>
  );
}

export function UpdateIncidentForm({
  incident,
}: {
  incident: {
    id: string;
    status: string;
    investigation: string | null;
    outcome: string | null;
  };
}) {
  const router = useRouter();
  // The parent remounts this form when the server status changes; lazy
  // initialization keeps the editable draft local to that mounted incident.
  const [status, setStatus] = useState(() => incident.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("id", incident.id);
    fd.set("status", status);
    let result: Awaited<ReturnType<typeof updateIncident>>;
    try {
      result = await updateIncident(fd);
    } catch {
      setError("Could not complete the operation. Please try again.");
      return;
    } finally {
      setBusy(false);
    }
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  return (
    <form aria-busy={busy} onSubmit={onSubmit} className="mt-3 border-t border-line pt-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="text-sm font-medium"><Tr>{"Status"}</Tr><Select
            name="status"
            aria-label="Status"
            value={status}
            onValueChange={setStatus}
            className="mt-1"
            options={STATUSES}
          />
        </div>
        <label className="text-sm font-medium sm:col-span-2"><Tr>{"Investigation"}</Tr><input
            name="investigation"
            defaultValue={incident.investigation ?? ""}
            className={field}
            placeholder="What has been done so far"
          />
        </label>
      </div>
      <label className="mt-3 block text-sm font-medium"><Tr>{"Outcome"}</Tr><input
          name="outcome"
          defaultValue={incident.outcome ?? ""}
          className={field}
          placeholder="Required before resolving or closing"
        />
      </label>
      {error && <p role="alert" className="mt-2 text-sm text-danger"><Tr>{error}</Tr></p>}
      <button
        type="submit"
        disabled={busy}
        className="mt-3 rounded-full border border-brand-strong px-4 py-1.5 text-sm text-brand-strong hover:bg-[#f2fbf5] disabled:opacity-50"
      >
        <Tr>{busy ? "Saving…" : "Save"}</Tr>
      </button>
    </form>
  );
}
