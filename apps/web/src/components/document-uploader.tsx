"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/lib/onboarding/actions";
import { OnboardingSteps } from "@/components/onboarding-steps";

export type DocItem = {
  typeId: string;
  name: string;
  critical: boolean;
  status: string | null; // verification_status, or null if not uploaded
};

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-[#defbe6] text-[#0e6027]",
  pending_review: "bg-[#f4f4f4] text-[#525252]",
  further_info_required: "bg-[#fcf4d6] text-[#684e1b]",
  rejected: "bg-[#fff1f1] text-[#a2191f]",
  expired: "bg-[#fff1f1] text-[#a2191f]",
};

function Badge({ status }: { status: string | null }) {
  if (!status) return <span className="bg-[#f4f4f4] px-2 py-1 text-xs text-[#8c8c8c]">Not uploaded</span>;
  return (
    <span className={`px-2 py-1 text-xs ${STATUS_STYLE[status] ?? "bg-[#f4f4f4] text-[#525252]"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

const field = "rounded-none border-b border-[#8c8c8c] bg-[#f4f4f4] px-2 py-1.5 text-sm focus:border-[#0f62fe] focus:outline-none";

export function DocumentUploader({ items }: { items: DocItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(e: React.FormEvent<HTMLFormElement>, typeId: string) {
    e.preventDefault();
    setBusy(typeId);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("documentTypeId", typeId);
    const r = await uploadDocument(fd);
    setBusy(null);
    if ("error" in r) setError(r.error);
    else router.refresh();
  }

  const allUploaded = items.every((i) => i.status);

  return (
    <div>
      <OnboardingSteps current={4} />
      <p className="mt-8 text-sm text-[#525252]">
        Upload each required document. Critical documents are checked by an administrator before
        you can accept bookings.
      </p>
      {error && <p className="mt-3 text-sm text-[#da1e28]">{error}</p>}

      <div className="mt-6 divide-y divide-[#e0e0e0] border border-[#e0e0e0]">
        {items.map((item) => (
          <div key={item.typeId} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">{item.name}</span>
                {item.critical && <span className="ml-2 text-xs text-[#0f62fe]">critical</span>}
              </div>
              <Badge status={item.status} />
            </div>
            <form onSubmit={(e) => onUpload(e, item.typeId)} className="mt-3 flex flex-wrap items-end gap-3">
              <input type="file" name="file" required className="text-sm" />
              <input name="referenceNumber" placeholder="Reference no. (optional)" className={field} />
              <label className="text-xs text-[#525252]">
                Expiry
                <input type="date" name="expiryDate" className={`${field} ml-2`} />
              </label>
              <button
                type="submit"
                disabled={busy === item.typeId}
                className="bg-[#161616] px-3 py-2 text-sm text-white hover:bg-[#393939] disabled:opacity-50"
              >
                {busy === item.typeId ? "Uploading…" : item.status ? "Replace" : "Upload"}
              </button>
            </form>
          </div>
        ))}
      </div>

      {allUploaded && (
        <div className="mt-6 border border-[#24a148] bg-[#defbe6] p-4 text-sm text-[#0e6027]">
          All documents uploaded. Your application is now with our administrators for verification.
        </div>
      )}
    </div>
  );
}
