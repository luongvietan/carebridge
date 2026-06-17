"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { runComplianceSweep } from "@/lib/admin/compliance-actions";

export function RunSweepButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        setBusy(true);
        await runComplianceSweep();
        setBusy(false);
        router.refresh();
      }}
      disabled={busy}
      className="rounded-full border border-[#dbe7e0] px-4 py-1.5 text-sm font-medium text-[#1e5a33] transition hover:border-[#bcd8c7] hover:bg-[#f5f7f6] disabled:opacity-50"
    >
      {busy ? "Running…" : "Run compliance sweep"}
    </button>
  );
}
