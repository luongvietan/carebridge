"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { openIncident, updateIncident } from "@/lib/admin/incident-actions";

const field =
  "mt-1 w-full rounded-xl border border-[#dbe7e0] bg-white px-3 py-2 text-sm text-[#1e5a33] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

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
    const result = await openIncident(fd);
    setBusy(false);
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
        className="rounded-full bg-[#2e7d32] px-4 py-2 text-sm text-white hover:bg-[#246627]"
      >
        Record a concern
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 rounded-2xl border border-[#dbe7e0] p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="text-sm font-medium">
          Kind
          <Select
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
        <div className="text-sm font-medium">
          Severity
          <Select
            name="severity"
            aria-label="Severity"
            value={severity}
            onValueChange={setSeverity}
            className="mt-1"
            options={SEVERITIES}
          />
        </div>
        <div className="text-sm font-medium">
          About (optional)
          <Select
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

      <label className="mt-3 block text-sm font-medium">
        Subject
        <input name="subject" required className={field} placeholder="Short summary" />
      </label>
      <label className="mt-3 block text-sm font-medium">
        What was reported
        <textarea name="details" required rows={4} className={field} />
      </label>
      <label className="mt-3 block text-sm font-medium">
        Reported by (optional)
        <input name="reportedBy" className={field} placeholder="Name, and how it reached us" />
      </label>

      {error && <p className="mt-2 text-sm text-[#da1e28]">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-[#2e7d32] px-4 py-2 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
        >
          {busy ? "Recording…" : "Record concern"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-[#dbe7e0] px-4 py-2 text-sm text-[#4a4a4a] hover:bg-[#f5f7f6]"
        >
          Cancel
        </button>
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
  const [status, setStatus] = useState(incident.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("id", incident.id);
    fd.set("status", status);
    const result = await updateIncident(fd);
    setBusy(false);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 border-t border-[#dbe7e0] pt-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="text-sm font-medium">
          Status
          <Select
            name="status"
            aria-label="Status"
            value={status}
            onValueChange={setStatus}
            className="mt-1"
            options={STATUSES}
          />
        </div>
        <label className="text-sm font-medium sm:col-span-2">
          Investigation
          <input
            name="investigation"
            defaultValue={incident.investigation ?? ""}
            className={field}
            placeholder="What has been done so far"
          />
        </label>
      </div>
      <label className="mt-3 block text-sm font-medium">
        Outcome
        <input
          name="outcome"
          defaultValue={incident.outcome ?? ""}
          className={field}
          placeholder="Required before resolving or closing"
        />
      </label>
      {error && <p className="mt-2 text-sm text-[#da1e28]">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="mt-3 rounded-full border border-[#2e7d32] px-4 py-1.5 text-sm text-[#2e7d32] hover:bg-[#f2fbf5] disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
