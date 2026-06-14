"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { runComplianceSweep } from "@/lib/admin/compliance-actions";

export function RunSweepButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        await runComplianceSweep();
        setBusy(false);
        router.refresh();
      }}
      disabled={busy}
      className="border border-[#8c8c8c] px-3 py-1.5 text-sm hover:bg-[#f4f4f4] disabled:opacity-50"
    >
      {busy ? "Running…" : "Run compliance sweep"}
    </button>
  );
}
