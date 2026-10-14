"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tr, usePortalT } from "@/components/portal-locale";
import { approveBookingReview, declineBookingReview } from "@/lib/risk-assessment/actions";

/** Approve (publish) or decline a request held by the risk assessment. */
export function RiskReviewActions({ bookingId }: { bookingId: string }) {
  const t = usePortalT();
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "approve" | "decline") {
    setError(null);
    if (kind === "decline" && !note.trim()) {
      setError("Please give the client a reason.");
      return;
    }
    setBusy(kind);
    try {
      const result = kind === "approve" ? await approveBookingReview(bookingId, note) : await declineBookingReview(bookingId, note);
      if ("error" in result) setError(result.error);
      else router.refresh();
    } catch {
      setError("Could not complete the operation. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const noteId = `review-note-${bookingId}`;
  return (
    <div className="space-y-3 border-t border-line pt-4">
      <label htmlFor={noteId} className="block text-sm font-medium">
        <Tr>{"Message to the client (required to decline)"}</Tr>
      </label>
      <textarea
        id={noteId}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={1000}
        className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-strong/15"
      />
      {error && <p role="alert" className="text-sm text-danger"><Tr>{error}</Tr></p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("approve")}
          className="rounded-full bg-brand-strong px-4 py-2 text-sm text-white hover:bg-brand-strong-hover disabled:opacity-50"
        >
          {busy === "approve" ? t("Saving…") : t("Approve and publish")}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("decline")}
          className="rounded-full border border-danger px-4 py-2 text-sm text-danger hover:bg-[#fff1f1] disabled:opacity-50"
        >
          {busy === "decline" ? t("Saving…") : t("Decline request")}
        </button>
      </div>
    </div>
  );
}
