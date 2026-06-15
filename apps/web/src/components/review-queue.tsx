"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewDocument, type ReviewDecision } from "@/lib/admin/compliance-actions";

export type ReviewItem = {
  documentId: string;
  professionalName: string;
  docTypeName: string;
  status: string;
  referenceNumber: string | null;
  expiryDate: string | null;
  viewUrl: string | null;
};

export function ReviewQueue({ items }: { items: ReviewItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(documentId: string, decision: ReviewDecision) {
    let note: string | undefined;
    if (decision !== "approved") {
      note = window.prompt(decision === "rejected" ? "Reason for rejection:" : "What further information is needed?") ?? undefined;
      if (note === undefined) return;
    }
    setBusy(documentId);
    setError(null);
    const r = await reviewDocument(documentId, decision, note);
    setBusy(null);
    if ("error" in r) setError(r.error);
    else router.refresh();
  }

  if (items.length === 0) {
    return <p className="mt-6 text-sm text-[#525252]">No documents are awaiting review.</p>;
  }

  return (
    <div className="mt-6">
      {error && <p className="mb-3 text-sm text-[#da1e28]">{error}</p>}
      <div className="divide-y divide-[#e0e0e0] border border-[#e0e0e0]">
        {items.map((it) => (
          <div key={it.documentId} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="text-sm">
              <span className="font-semibold">{it.professionalName}</span>
              <span className="text-[#525252]"> — {it.docTypeName}</span>
              {it.referenceNumber && <span className="text-[#8c8c8c]"> · ref {it.referenceNumber}</span>}
              {it.expiryDate && <span className="text-[#8c8c8c]"> · expires {it.expiryDate}</span>}
              <span className="ml-2 bg-[#f4f4f4] px-2 py-0.5 text-xs text-[#525252]">
                {it.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {it.viewUrl && (
                <a href={it.viewUrl} target="_blank" rel="noreferrer" className="text-[#198038] underline">
                  View
                </a>
              )}
              <button
                onClick={() => decide(it.documentId, "approved")}
                disabled={busy === it.documentId}
                className="bg-[#198038] px-3 py-1.5 text-white hover:bg-[#0e6027] disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => decide(it.documentId, "further_info_required")}
                disabled={busy === it.documentId}
                className="border border-[#8c8c8c] px-3 py-1.5 hover:bg-[#f4f4f4] disabled:opacity-50"
              >
                Request info
              </button>
              <button
                onClick={() => decide(it.documentId, "rejected")}
                disabled={busy === it.documentId}
                className="bg-[#da1e28] px-3 py-1.5 text-white hover:bg-[#b81921] disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
