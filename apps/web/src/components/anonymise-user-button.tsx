"use client";
import { usePortalT } from "@/components/portal-locale";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { anonymiseUser } from "@/lib/admin/gdpr-actions";
import { useConfirmDialog } from "@/components/ui/app-dialog";

const CONFIRM =
  "Permanently anonymise this user's personal data? Compliance and financial records are retained in anonymised form. This cannot be undone.";

export function AnonymiseUserButton({ userId }: { userId: string }) {
  const router = useRouter();
  const t = usePortalT();
  const { confirm, dialog } = useConfirmDialog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onClick() {
    if (!(await confirm(t(CONFIRM), { variant: "destructive", confirmLabel: t("Anonymise") }))) return;
    setBusy(true);
    setError(null);
    let r: Awaited<ReturnType<typeof anonymiseUser>>;
    try {
      r = await anonymiseUser(userId);
    } catch {
      setError(t("Could not complete the operation. Please try again."));
      return;
    } finally {
      setBusy(false);
    }
    if ("error" in r) {
      setError(t(r.error));
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) return <span role="status" className="text-xs text-[#0e6027]">{t("Anonymised")}</span>;

  return (
    <span className="inline-flex flex-col gap-1">
      {dialog}
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="rounded-full border border-danger px-3 py-1 text-xs text-danger hover:bg-[#fff1f1] disabled:opacity-50"
      >
        {busy ? "Anonymising…" : t("Anonymise (GDPR)")}
      </button>
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
    </span>
  );
}
