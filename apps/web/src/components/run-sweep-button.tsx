"use client";
import { useState } from "react";
import { usePortalT } from "@/components/portal-locale";
import { useRouter } from "next/navigation";
import { runComplianceSweep, runComplianceReminders } from "@/lib/admin/compliance-actions";

const BTN =
  "rounded-full border border-line px-4 py-1.5 text-sm font-medium text-brand-ink transition hover:border-line-hover hover:bg-surface disabled:opacity-50";

export function RunSweepButton() {
  const t = usePortalT();
  const router = useRouter();
  const [busy, setBusy] = useState<null | "sweep" | "remind">(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function runSweep() {
    setBusy("sweep");
    setMessage(null);
    try {
    const result = await runComplianceSweep();
    if ("error" in result) {
      setMessage({ kind: "error", text: result.error });
      return;
    }
    setMessage({ kind: "ok", text: "Compliance sweep complete." });
    router.refresh();
    } catch {
      setMessage({ kind: "error", text: t("Could not complete the operation. Please try again.") });
    } finally {
      setBusy(null);
    }
  }

  async function sendReminders() {
    setBusy("remind");
    setMessage(null);
    try {
    const result = await runComplianceReminders();
    if ("error" in result) {
      setMessage({ kind: "error", text: result.error });
      return;
    }
    setMessage({
      kind: "ok",
      text: result.sent === 0 ? t("No reminders were due.") : t("Sent {n} expiry reminder(s).", { n: result.sent }),
    });
    router.refresh();
    } catch {
      setMessage({ kind: "error", text: t("Could not complete the operation. Please try again.") });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div aria-busy={busy !== null} className="flex flex-wrap gap-2">
        <button type="button" onClick={runSweep} disabled={busy !== null} className={BTN}>
          {busy === "sweep" ? t("Running…") : t("Run compliance sweep")}
        </button>
        <button type="button" onClick={sendReminders} disabled={busy !== null} className={BTN}>
          {busy === "remind" ? t("Sending…") : t("Send expiry reminders")}
        </button>
      </div>
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`text-xs ${message.kind === "error" ? "text-danger" : "text-brand-ink"}`}>
          {t(message.text)}
        </p>
      )}
    </div>
  );
}
