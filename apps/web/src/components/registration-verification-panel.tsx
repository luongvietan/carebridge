"use client";
import { RequiredMark } from "@/components/required-mark";
import { Tr } from "@/components/portal-locale";
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
  "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-brand-ink focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-strong/15";

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
    let result: Awaited<ReturnType<typeof recordRegistrationVerification>>;
    try { result = await recordRegistrationVerification(fd); } catch { setError("Could not complete the operation. Please try again."); return; } finally { setBusy(false); }
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="font-semibold">{item.professionalName}</span>
          <span className="ml-2 text-sm text-muted">{item.roleName}</span>
        </div>
        <a
          href={REGISTER_LOOKUP_URL[item.register]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-strong underline"
        ><Tr>{"Open the"}</Tr>{REGISTER_LABEL[item.register]}
        </a>
      </div>

      {item.lastCheckedAt && (
        <p className="mt-2 text-xs text-[#684e1b]"><Tr>{"Last checked"}</Tr>{item.lastCheckedAt.slice(0, 10)} — {item.lastOutcome?.replace(/_/g, " ")}
          {item.validUntil && `, valid until ${item.validUntil}`}<Tr>{". A new check is due."}</Tr></p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {REFERENCE_LABEL[item.register]}<Tr>{"checked"}</Tr><RequiredMark /><input
            name="reference"
            required
            defaultValue={item.reference ?? ""}
            placeholder={REFERENCE_PLACEHOLDER[item.register]}
            className={field}
          />
        </label>
        <div className="block text-sm font-medium"><Tr>{"What the register showed"}</Tr><Select
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
        <div className="mt-3 space-y-2 rounded-xl bg-surface p-3 text-sm">
          <label className="flex items-start gap-2">
            <input type="checkbox" name="confirmActive" className="mt-1 accent-brand-strong" />
            <span><Tr>{"I have confirmed the registration is currently active on the register."}</Tr></span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="confirmIdentity" className="mt-1 accent-brand-strong" />
            <span><Tr>{"The name and details on the register match this applicant."}</Tr></span>
          </label>
        </div>
      )}

      <label className="mt-3 block text-sm font-medium"><Tr>{"Notes (optional)"}</Tr><input name="notes" className={field} placeholder="Anything worth recording about the check" />
      </label>

      {error && <p role="alert" className="mt-2 text-sm text-danger"><Tr>{error}</Tr></p>}

      <button
        type="submit"
        disabled={busy || !outcome}
        className="mt-3 rounded-full bg-brand-strong px-4 py-2 text-sm text-white hover:bg-brand-strong-hover disabled:opacity-50"
      >
        <Tr>{busy ? "Recording…" : "Record verification"}</Tr>
      </button>
    </form>
  );
}

export function RegistrationVerificationPanel({ items }: { items: RegistrationCheckItem[] }) {
  if (items.length === 0) {
    return (
      <p className="mt-3 text-sm text-ink"><Tr>{"Every regulated professional has a current register check on file."}</Tr></p>
    );
  }
  return (
    <div className="mt-4 divide-y divide-line border border-line">
      {items.map((item) => (
        <VerificationForm key={`${item.professionalId}-${item.register}`} item={item} />
      ))}
    </div>
  );
}
