"use client";
import { Tr } from "@/components/portal-locale";
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
      <div className="flex h-36 w-48 shrink-0 items-center justify-center rounded-xl border border-dashed border-line bg-surface text-xs text-muted"><Tr>{"Preview unavailable"}</Tr></div>
    );
  }

  if (item.contentKind === "image") {
    return (
      <a
        href={item.previewUrl}
        target="_blank"
        rel="noreferrer"
        className="block shrink-0 overflow-hidden rounded-xl border border-line bg-surface"
      >
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
      className="h-48 w-full min-w-[16rem] max-w-md shrink-0 rounded-xl border border-line bg-white"
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
    try {
    const r = await reviewDocument(documentId, decision, note);
    if ("error" in r) setError(r.error);
    else router.refresh();
    } catch {
      setError("Could not complete the operation. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return <p className="mt-6 text-sm text-ink"><Tr>{"No documents are awaiting review."}</Tr></p>;
  }

  return (
    <div className="mt-6">
      {dialog}
      {error && <p role="alert" className="mb-3 text-sm text-danger"><Tr>{error}</Tr></p>}
      <div className="divide-y divide-line border border-line">
        {items.map((it) => (
          <div key={it.documentId} className="flex flex-wrap gap-4 p-4">
            <DocumentPreview item={it} />
            <div className="flex min-w-[12rem] flex-1 flex-col justify-between gap-3">
              <div className="text-sm">
                <span className="font-semibold">{it.professionalName}</span>
                <span className="text-ink"> — {it.docTypeName}</span>
                {it.referenceNumber && <span className="text-muted"><Tr>{"· ref"}</Tr>{it.referenceNumber}</span>}
                {it.expiryDate && <span className="text-muted"><Tr>{"· expires"}</Tr>{it.expiryDate}</span>}
                <span className="ml-2 rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink">
                  {it.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {it.previewUrl && (
                  <a
                    href={it.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-strong underline"
                  ><Tr>{"Open full size"}</Tr></a>
                )}
                {it.downloadUrl && (
                  <a href={it.downloadUrl} className="text-ink underline"><Tr>{"Download"}</Tr></a>
                )}
                <button
                  type="button"
                  onClick={() => decide(it.documentId, "approved")}
                  disabled={busy === it.documentId}
                  className="rounded-full bg-brand-strong px-3 py-1.5 text-white hover:bg-brand-strong-hover disabled:opacity-50"
                ><Tr>{"Approve"}</Tr></button>
                <button
                  type="button"
                  onClick={() => decide(it.documentId, "further_info_required")}
                  disabled={busy === it.documentId}
                  className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-brand-ink transition hover:border-line-hover hover:bg-surface disabled:opacity-50"
                ><Tr>{"Request info"}</Tr></button>
                <button
                  type="button"
                  onClick={() => decide(it.documentId, "rejected")}
                  disabled={busy === it.documentId}
                  className="bg-danger px-3 py-1.5 text-white hover:bg-[#b81921] disabled:opacity-50"
                ><Tr>{"Reject"}</Tr></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
