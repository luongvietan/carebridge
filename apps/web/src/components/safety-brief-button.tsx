"use client";
import { useState } from "react";
import { usePortalLocale, usePortalT } from "@/components/portal-locale";
import { readSafetyBrief } from "@/lib/risk-assessment/actions";
import { BRIEF_LABEL } from "@/lib/risk-assessment/brief";

type Brief = Awaited<ReturnType<typeof readSafetyBrief>>;

/**
 * Shows the booking's safety and needs brief on request. Fetching it (rather
 * than sending it with the list) means every view is a logged read, as Ana's
 * spec requires for the matched professional.
 */
export function SafetyBriefButton({ bookingId }: { bookingId: string }) {
  const t = usePortalT();
  const locale = usePortalLocale();
  const lang = locale === "pt-PT" ? "pt" : "en";
  const [brief, setBrief] = useState<Brief | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (open) return setOpen(false);
    if (brief === undefined) {
      setBusy(true);
      try {
        setBrief(await readSafetyBrief(bookingId));
      } catch {
        setBrief(null);
      } finally {
        setBusy(false);
      }
    }
    setOpen(true);
  }

  const panelId = `brief-${bookingId}`;
  return (
    <div className="mt-1">
      <button type="button" onClick={toggle} aria-expanded={open} aria-controls={panelId} disabled={busy} className="text-xs font-semibold text-brand-strong underline">
        {busy ? t("Loading…") : open ? t("Hide safety information") : t("Safety information")}
      </button>
      {open && (
        <div id={panelId} className="mt-2 max-w-sm rounded-xl border border-line bg-surface p-3 text-xs text-ink">
          {brief ? (
            <>
              {brief.requiresTwoWorkers && <p className="mb-1 font-semibold text-danger">{t("Two workers required")}</p>}
              <ul className="list-disc space-y-1 pl-4">
                {brief.items.map((item) => <li key={item}>{BRIEF_LABEL[item]?.[lang] ?? item}</li>)}
              </ul>
              {brief.instructions && <p className="mt-2 whitespace-pre-wrap font-medium">{brief.instructions}</p>}
              {brief.items.length === 0 && !brief.instructions && <p>{t("No specific safety needs were reported.")}</p>}
            </>
          ) : (
            <p>{t("No safety information for this booking.")}</p>
          )}
        </div>
      )}
    </div>
  );
}
