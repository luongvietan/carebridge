"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { runComplianceSweep, runComplianceReminders } from "@/lib/admin/compliance-actions";

const BTN =
  "rounded-full border border-[#dbe7e0] px-4 py-1.5 text-sm font-medium text-[#1e5a33] transition hover:border-[#bcd8c7] hover:bg-[#f5f7f6] disabled:opacity-50";

export function RunSweepButton() {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "sweep" | "remind">(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function runSweep() {
    setBusy("sweep");
    setMessage(null);
    const result = await runComplianceSweep();
    setBusy(null);
    if ("error" in result) {
      setMessage({ kind: "error", text: result.error });
      return;
    }
    setMessage({ kind: "ok", text: "Compliance sweep complete." });
    router.refresh();
  }

  async function sendReminders() {
    setBusy("remind");
    setMessage(null);
    const result = await runComplianceReminders();
    setBusy(null);
    if ("error" in result) {
      setMessage({ kind: "error", text: result.error });
      return;
    }
    setMessage({
      kind: "ok",
      text: result.sent === 0 ? "No reminders were due." : `Sent ${result.sent} expiry reminder(s).`,
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button type="button" onClick={runSweep} disabled={busy !== null} className={BTN}>
          {busy === "sweep" ? "Running…" : "Run compliance sweep"}
        </button>
        <button type="button" onClick={sendReminders} disabled={busy !== null} className={BTN}>
          {busy === "remind" ? "Sending…" : "Send expiry reminders"}
        </button>
      </div>
      {message && (
        <p className={`text-xs ${message.kind === "error" ? "text-[#da1e28]" : "text-[#1e5a33]"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
