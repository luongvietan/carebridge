"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setAccountStatus } from "@/lib/admin/account-actions";
import { canSetAccountStatus, type AccountStatus } from "@/lib/admin/account-status";

const INPUT_CLASS =
  "border-b border-[#7a8a81] bg-[#f5f7f6] px-2 py-1 text-sm focus:border-[#198038] focus:outline-none w-full";

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

      <label className="flex flex-col gap-1 text-[#5b6a62]">
        Set account status to
        <select
          value={next}
          onChange={(e) => setNext(e.target.value as AccountStatus)}
          className={INPUT_CLASS}
          required
        >
          {legalNext.map((status) => (
            <option key={status} value={status}>
              {formatLabel(status)}
            </option>
          ))}
        </select>
      </label>

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
        className="bg-[#198038] px-4 py-1.5 text-white hover:bg-[#0e6027] disabled:opacity-50"
      >
        {pending ? "Updating…" : "Update account status"}
      </button>
    </form>
  );
}
