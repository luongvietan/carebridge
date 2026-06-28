"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewDocument, type ReviewDecision } from "@/lib/admin/compliance-actions";
import { usePromptDialog } from "@/components/ui/app-dialog";

export type ReviewItem = {
  documentId: string;
  professionalName: string;
  docTypeName: string;
  status: string;
  referenceNumber: string | null;
  expiryDate: string | null;
  contentKind: "image" | "pdf";
  previewUrl: string | null;
  downloadUrl: string | null;
};

function DocumentPreview({ item }: { item: ReviewItem }) {
  if (!item.previewUrl) {
    return (
      <div className="flex h-36 w-48 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#dbe7e0] bg-[#f5f7f6] text-xs text-[#7a8a81]">
        Preview unavailable
      </div>
    );
  }

  if (item.contentKind === "image") {
    return (
      <a
        href={item.previewUrl}
        target="_blank"
        rel="noreferrer"
        className="block shrink-0 overflow-hidden rounded-xl border border-[#dbe7e0] bg-[#f5f7f6]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.previewUrl}
          alt={`${item.docTypeName} for ${item.professionalName}`}
          className="h-36 w-48 object-contain"
        />
      </a>
    );
  }

  return (
    <iframe
      src={item.previewUrl}
      title={`${item.docTypeName} for ${item.professionalName}`}
      sandbox=""
      className="h-48 w-full min-w-[16rem] max-w-md shrink-0 rounded-xl border border-[#dbe7e0] bg-white"
    />
  );
}

export function ReviewQueue({ items }: { items: ReviewItem[] }) {
  const router = useRouter();
  const { prompt, dialog } = usePromptDialog();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(documentId: string, decision: ReviewDecision) {
    let note: string | undefined;
    if (decision !== "approved") {
      const input = await prompt(
        decision === "rejected" ? "Reason for rejection:" : "What further information is needed?",
      );
      if (input === null) return;
      note = input;
    }
    setBusy(documentId);
    setError(null);
    const r = await reviewDocument(documentId, decision, note);
    setBusy(null);
    if ("error" in r) setError(r.error);
    else router.refresh();
  }

  if (items.length === 0) {
    return <p className="mt-6 text-sm text-[#4a4a4a]">No documents are awaiting review.</p>;
  }

  return (
    <div className="mt-6">
      {dialog}
      {error && <p className="mb-3 text-sm text-[#da1e28]">{error}</p>}
      <div className="divide-y divide-[#dbe7e0] border border-[#dbe7e0]">
        {items.map((it) => (
          <div key={it.documentId} className="flex flex-wrap gap-4 p-4">
            <DocumentPreview item={it} />
            <div className="flex min-w-[12rem] flex-1 flex-col justify-between gap-3">
              <div className="text-sm">
                <span className="font-semibold">{it.professionalName}</span>
                <span className="text-[#4a4a4a]"> — {it.docTypeName}</span>
                {it.referenceNumber && <span className="text-[#7a8a81]"> · ref {it.referenceNumber}</span>}
                {it.expiryDate && <span className="text-[#7a8a81]"> · expires {it.expiryDate}</span>}
                <span className="ml-2 rounded-full bg-[#f5f7f6] px-2.5 py-0.5 text-xs font-medium text-[#4a4a4a]">
                  {it.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {it.previewUrl && (
                  <a
                    href={it.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2e7d32] underline"
                  >
                    Open full size
                  </a>
                )}
                {it.downloadUrl && (
                  <a href={it.downloadUrl} className="text-[#4a4a4a] underline">
                    Download
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => decide(it.documentId, "approved")}
                  disabled={busy === it.documentId}
                  className="rounded-full bg-[#2e7d32] px-3 py-1.5 text-white hover:bg-[#246627] disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => decide(it.documentId, "further_info_required")}
                  disabled={busy === it.documentId}
                  className="rounded-full border border-[#dbe7e0] px-4 py-1.5 text-sm font-medium text-[#1e5a33] transition hover:border-[#bcd8c7] hover:bg-[#f5f7f6] disabled:opacity-50"
                >
                  Request info
                </button>
                <button
                  type="button"
                  onClick={() => decide(it.documentId, "rejected")}
                  disabled={busy === it.documentId}
                  className="bg-[#da1e28] px-3 py-1.5 text-white hover:bg-[#b81921] disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
