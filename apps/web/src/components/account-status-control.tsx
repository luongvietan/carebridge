"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setAccountStatus } from "@/lib/admin/account-actions";
import { canSetAccountStatus, type AccountStatus } from "@/lib/admin/account-status";
import { Select } from "@/components/ui/select";

const INPUT_CLASS =
  "w-full rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-sm text-[#0c4a35] placeholder:text-[#9aa8a0] focus:border-[#198038] focus:outline-none focus:ring-2 focus:ring-[#198038]/15";

const ALL_STATUSES: AccountStatus[] = ["active", "suspended", "deactivated"];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

type Props = {
  userId: string;
  current: AccountStatus;
};

export function AccountStatusControl({ userId, current }: Props) {
  const router = useRouter();
  const legalNext = ALL_STATUSES.filter((next) => canSetAccountStatus(current, next).ok);

  const [next, setNext] = useState<AccountStatus | "">(legalNext[0] ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (legalNext.length === 0) {
    return (
      <p className="text-sm text-[#5b6a62]">
        Current account status: <span className="font-medium">{formatLabel(current)}</span>. No
        changes available.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!next) return;

    setPending(true);
    setError(null);

    const result = await setAccountStatus(userId, next, reason.trim() || undefined);

    setPending(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setReason("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <p className="text-[#5b6a62]">
        Current: <span className="font-medium">{formatLabel(current)}</span>
      </p>

      <div className="flex flex-col gap-1 text-[#5b6a62]">
        Set account status to
        <Select
          aria-label="Set account status to"
          value={next}
          onValueChange={(v) => setNext(v as AccountStatus)}
          options={legalNext.map((status) => ({ value: status, label: formatLabel(status) }))}
        />
      </div>

      <label className="flex flex-col gap-1 text-[#5b6a62]">
        Reason (optional)
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className={INPUT_CLASS}
        />
      </label>

      {error && <p className="text-sm text-[#da1e28]">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#0c6e4f] px-4 py-1.5 text-white hover:bg-[#0a5c42] disabled:opacity-50"
      >
        {pending ? "Updating…" : "Update account status"}
      </button>
    </form>
  );
}
