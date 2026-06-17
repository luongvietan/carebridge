"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { anonymiseUser } from "@/lib/admin/gdpr-actions";

const CONFIRM =
  "Permanently anonymise this user's personal data? Compliance and financial records are retained in anonymised form. This cannot be undone.";

export function AnonymiseUserButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onClick() {
    if (!window.confirm(CONFIRM)) return;
    setBusy(true);
    setError(null);
    const r = await anonymiseUser(userId);
    setBusy(false);
    if ("error" in r) {
      setError(r.error);
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) return <span className="text-xs text-[#0e6027]">Anonymised</span>;

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="rounded-full border border-[#da1e28] px-3 py-1 text-xs text-[#da1e28] hover:bg-[#fff1f1] disabled:opacity-50"
      >
        {busy ? "Anonymising…" : "Anonymise (GDPR)"}
      </button>
      {error && <span className="text-xs text-[#da1e28]">{error}</span>}
    </span>
  );
}
