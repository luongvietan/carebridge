"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { recordRegistrationVerification } from "@/lib/admin/registration-actions";
import { VERIFICATION_OUTCOMES } from "@/lib/compliance/registration-verification";
import {
  REFERENCE_LABEL,
  REFERENCE_PLACEHOLDER,
  REGISTER_LABEL,
  REGISTER_LOOKUP_URL,
  type RegulatorRegister,
} from "@/lib/compliance/regulated-roles";

export type RegistrationCheckItem = {
  professionalId: string;
  professionalName: string;
  roleName: string;
  register: RegulatorRegister;
  /** The number the professional gave us, pre-filled for the administrator. */
  reference: string | null;
  /** Present when a check exists but has lapsed or did not pass. */
  lastOutcome: string | null;
  lastCheckedAt: string | null;
  validUntil: string | null;
};

const field =
  "mt-1 w-full rounded-xl border border-[#dbe7e0] bg-white px-3 py-2 text-sm text-[#1e5a33] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

function VerificationForm({ item }: { item: RegistrationCheckItem }) {
  const router = useRouter();
  const [outcome, setOutcome] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("professionalId", item.professionalId);
    fd.set("outcome", outcome);
    const result = await recordRegistrationVerification(fd);
    setBusy(false);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="font-semibold">{item.professionalName}</span>
          <span className="ml-2 text-sm text-[#7a8a81]">{item.roleName}</span>
        </div>
        <a
          href={REGISTER_LOOKUP_URL[item.register]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#2e7d32] underline"
        >
          Open the {REGISTER_LABEL[item.register]}
        </a>
      </div>

      {item.lastCheckedAt && (
        <p className="mt-2 text-xs text-[#684e1b]">
          Last checked {item.lastCheckedAt.slice(0, 10)} — {item.lastOutcome?.replace(/_/g, " ")}
          {item.validUntil && `, valid until ${item.validUntil}`}. A new check is due.
        </p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {REFERENCE_LABEL[item.register]} checked
          <input
            name="reference"
            required
            defaultValue={item.reference ?? ""}
            placeholder={REFERENCE_PLACEHOLDER[item.register]}
            className={field}
          />
        </label>
        <div className="block text-sm font-medium">
          What the register showed
          <Select
            name="outcome"
            aria-label="What the register showed"
            required
            value={outcome}
            onValueChange={setOutcome}
            placeholder="Select the result…"
            className="mt-1"
            options={VERIFICATION_OUTCOMES.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
      </div>

      {outcome === "active" && (
        <div className="mt-3 space-y-2 rounded-xl bg-[#f5f7f6] p-3 text-sm">
          <label className="flex items-start gap-2">
            <input type="checkbox" name="confirmActive" className="mt-1 accent-[#2e7d32]" />
            <span>I have confirmed the registration is currently active on the register.</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="confirmIdentity" className="mt-1 accent-[#2e7d32]" />
            <span>The name and details on the register match this applicant.</span>
          </label>
        </div>
      )}

      <label className="mt-3 block text-sm font-medium">
        Notes (optional)
        <input name="notes" className={field} placeholder="Anything worth recording about the check" />
      </label>

      {error && <p className="mt-2 text-sm text-[#da1e28]">{error}</p>}

      <button
        type="submit"
        disabled={busy || !outcome}
        className="mt-3 rounded-full bg-[#2e7d32] px-4 py-2 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
      >
        {busy ? "Recording…" : "Record verification"}
      </button>
    </form>
  );
}

export function RegistrationVerificationPanel({ items }: { items: RegistrationCheckItem[] }) {
  if (items.length === 0) {
    return (
      <p className="mt-3 text-sm text-[#4a4a4a]">
        Every regulated professional has a current register check on file.
      </p>
    );
  }
  return (
    <div className="mt-4 divide-y divide-[#dbe7e0] border border-[#dbe7e0]">
      {items.map((item) => (
        <VerificationForm key={`${item.professionalId}-${item.register}`} item={item} />
      ))}
    </div>
  );
}
