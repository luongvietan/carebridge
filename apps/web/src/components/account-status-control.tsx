"use client";
import { usePortalT } from "@/components/portal-locale";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setAccountStatus } from "@/lib/admin/account-actions";
import { canSetAccountStatus, type AccountStatus } from "@/lib/admin/account-status";
import { useConfirmDialog } from "@/components/ui/app-dialog";
import { Select } from "@/components/ui/select";

const INPUT_CLASS =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-muted focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-strong/15";

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
  const t = usePortalT();
  const { confirm, dialog } = useConfirmDialog();
  const legalNext = ALL_STATUSES.filter((next) => canSetAccountStatus(current, next).ok);

  const [next, setNext] = useState<AccountStatus | "">(legalNext[0] ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  if (legalNext.length === 0) {
    return (
      <p className="text-sm text-ink">
        {t("Current account status:")} <span className="font-medium">{t(formatLabel(current))}</span>. {t("No changes available.")}
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!next) return;
    if (!(await confirm(t("Change this account from {current} to {next}? This changes the user's access to the service.", { current: t(formatLabel(current)), next: t(formatLabel(next)) }), { variant: next === "active" ? "default" : "destructive", confirmLabel: t("Confirm status change") }))) return;

    setPending(true);
    setError(null);
    setSaved(false);

    let result: Awaited<ReturnType<typeof setAccountStatus>>;
    try {
      result = await setAccountStatus(userId, next, reason.trim() || undefined);
    } catch {
      setError(t("Could not complete the operation. Please try again."));
      return;
    } finally {
      setPending(false);
    }

    if ("error" in result) {
      setError(t(result.error));
      return;
    }

    setSaved(true);
    setReason("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={pending} className="space-y-4 text-sm">
      {dialog}
      <p className="text-ink">
        {t("Current:")} <span className="font-medium">{t(formatLabel(current))}</span>
      </p>

      <div className="flex flex-col gap-1 text-ink">
        {t("Set account status to")}
        <Select
          aria-label={t("Set account status to")}
          value={next}
          onValueChange={(v) => setNext(v as AccountStatus)}
          options={legalNext.map((status) => ({ value: status, label: t(formatLabel(status)) }))}
        />
      </div>

      <label className="flex flex-col gap-1 text-ink">
        {t("Reason (optional)")}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className={INPUT_CLASS}
        />
      </label>

      {saved && <p role="status">{t("Account status updated.")}</p>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-strong px-4 py-1.5 text-white hover:bg-brand-strong-hover disabled:opacity-50"
      >
        {pending ? t("Updating…") : t("Update account status")}
      </button>
    </form>
  );
}
