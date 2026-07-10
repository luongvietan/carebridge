"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/lib/onboarding/actions";
import { OnboardingSteps } from "@/components/onboarding-steps";
import { DatePicker } from "@/components/ui/date-picker";
import { FilePreviewInput, type ExistingFile } from "@/components/ui/file-input";

export type DocItem = {
  typeId: string;
  name: string;
  critical: boolean;
  hasExpiry: boolean; // type carries an expiry → an expiry date is required on upload
  status: string | null; // verification_status, or null if not uploaded
  rejectionReason?: string | null; // admin's note for rejected / further-info docs
  existing?: ExistingFile | null; // the file already on record, for preview
};

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-[#defbe6] text-[#0e6027]",
  pending_review: "bg-[#f5f7f6] text-[#4a4a4a]",
  further_info_required: "bg-[#fcf4d6] text-[#684e1b]",
  rejected: "bg-[#fff1f1] text-[#a2191f]",
  expired: "bg-[#fff1f1] text-[#a2191f]",
};

function Badge({ status }: { status: string | null }) {
  if (!status) return <span className="bg-[#f5f7f6] px-2 py-1 text-xs text-[#7a8a81]">Not uploaded</span>;
  return (
    <span className={`px-2 py-1 text-xs ${STATUS_STYLE[status] ?? "bg-[#f5f7f6] text-[#4a4a4a]"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

const field = "rounded-xl border border-[#dbe7e0] bg-white px-2 py-1.5 text-sm focus:border-[#2e7d32] focus:outline-none";

export function DocumentUploader({ items }: { items: DocItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(e: React.FormEvent<HTMLFormElement>, item: DocItem) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("documentTypeId", item.typeId);
    if (item.hasExpiry && !String(fd.get("expiryDate") ?? "").trim()) {
      setError(`${item.name}: an expiry date is required for this document.`);
      return;
    }
    setBusy(item.typeId);
    setError(null);
    const r = await uploadDocument(fd);
    setBusy(null);
    if ("error" in r) setError(r.error);
    else router.refresh();
  }

  const allUploaded = items.every((i) => i.status);

  return (
    <div>
      <OnboardingSteps current={4} />
      <p className="mt-8 text-sm text-[#4a4a4a]">
        Upload each required document. Critical documents are checked by an administrator before
        you can accept bookings.
      </p>
      {error && <p className="mt-3 text-sm text-[#da1e28]">{error}</p>}

      <div className="mt-6 divide-y divide-[#dbe7e0] border border-[#dbe7e0]">
        {items.map((item) => (
          <div key={item.typeId} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">{item.name}</span>
                {item.critical && <span className="ml-2 text-xs text-[#2e7d32]">critical</span>}
              </div>
              <Badge status={item.status} />
            </div>
            {(item.status === "rejected" || item.status === "further_info_required") &&
              item.rejectionReason && (
                <p className="mt-2 rounded-lg bg-[#fff1f1] px-3 py-2 text-xs text-[#a2191f]">
                  <span className="font-semibold">Administrator note:</span> {item.rejectionReason}
                </p>
              )}
            <form onSubmit={(e) => onUpload(e, item)} className="mt-3 flex flex-wrap items-end gap-3">
              <div className="w-full sm:w-80">
                <FilePreviewInput
                  name="file"
                  variant="document"
                  required
                  aria-label={`Upload ${item.name}`}
                  existing={item.existing ?? null}
                />
              </div>
              <input name="referenceNumber" placeholder="Reference no. (optional)" aria-label="Reference number" className={field} />
              <input name="issuingBody" placeholder="Issuing body (e.g. NMC, optional)" aria-label="Issuing body" className={field} />
              <div className="text-xs text-[#4a4a4a]">
                Expiry{item.hasExpiry && <span className="text-[#da1e28]"> *</span>}
                <DatePicker
                  name="expiryDate"
                  required={item.hasExpiry}
                  aria-label={item.hasExpiry ? "Expiry date (required)" : "Expiry date"}
                  className="mt-1 w-40"
                />
              </div>
              <button
                type="submit"
                disabled={busy === item.typeId}
                className="bg-[#14301e] px-3 py-2 text-sm text-white hover:bg-[#33433a] disabled:opacity-50"
              >
                {busy === item.typeId ? "Uploading…" : item.status ? "Replace" : "Upload"}
              </button>
            </form>
          </div>
        ))}
      </div>

      {allUploaded && (
        <div className="mt-6 border border-[#2e7d32] bg-[#defbe6] p-4 text-sm text-[#0e6027]">
          All documents uploaded. Your application is now with our administrators for verification.
        </div>
      )}
    </div>
  );
}
