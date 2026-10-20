"use client";
import { referenceLabel } from "@/lib/i18n/reference-en";
import Link from "next/link";
import { Tr, usePortalT } from "@/components/portal-locale";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/lib/onboarding/actions";
import { OnboardingSteps } from "@/components/onboarding-steps";
import { onboardingCopy, type OnboardingLocale } from "@/lib/onboarding/copy";
import { DatePicker } from "@/components/ui/date-picker";
import { FilePreviewInput, type ExistingFile } from "@/components/ui/file-input";
import { guidanceFor } from "@/lib/onboarding/document-guidance";

export type DocItem = {
  typeId: string;
  code: string; // document_types.code — keys the acceptable-documents guidance
  name: string;
  critical: boolean;
  optional?: boolean; // "when applicable": asked for, but not owed by everyone
  hasExpiry: boolean; // type carries an expiry → an expiry date is required on upload
  status: string | null; // verification_status, or null if not uploaded
  rejectionReason?: string | null; // admin's note for rejected / further-info docs
  existing?: ExistingFile | null; // the file already on record, for preview
};

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-[#defbe6] text-[#0e6027]",
  pending_review: "bg-surface text-ink",
  further_info_required: "bg-[#fcf4d6] text-[#684e1b]",
  rejected: "bg-[#fff1f1] text-[#a2191f]",
  expired: "bg-[#fff1f1] text-[#a2191f]",
};

const STATUS_LABEL: Record<string, string> = {
  approved: "Approved",
  pending_review: "Pending review",
  further_info_required: "Further information required",
  rejected: "Rejected",
  expired: "Expired",
};

function Badge({ status, notUploaded }: { status: string | null; notUploaded: string }) {
  const t = usePortalT();
  if (!status) return <span className="bg-surface px-2 py-1 text-xs text-muted">{notUploaded}</span>;
  return (
    <span className={`px-2 py-1 text-xs ${STATUS_STYLE[status] ?? "bg-surface text-ink"}`}>
      {t(STATUS_LABEL[status] ?? status.replace(/_/g, " "))}
    </span>
  );
}

const field = "rounded-xl border border-line bg-white px-2 py-1.5 text-sm focus:border-brand-strong focus:outline-none";

export function DocumentUploader({
  items,
  locale = "en-GB",
  country = "GB",
}: {
  items: DocItem[];
  locale?: OnboardingLocale;
  country?: "PT" | "GB";
}) {
  const d = country === "PT" && locale === "en-GB" ? { ...onboardingCopy[locale].documents, bankDetails: "Add your bank details securely so we can pay you in EUR.", bankDetailsLink: "Add bank details", issuingPlaceholder: "Issuing body (e.g. professional Ordem, optional)" } : onboardingCopy[locale].documents;
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(e: React.FormEvent<HTMLFormElement>, item: DocItem) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("documentTypeId", item.typeId);
    if (item.hasExpiry && !String(fd.get("expiryDate") ?? "").trim()) {
      setError(`${referenceLabel(item.name, locale)}: ${d.expiryRequired}`);
      return;
    }
    setBusy(item.typeId);
    setError(null);
    const r = await uploadDocument(fd);
    setBusy(null);
    if ("error" in r) setError(r.error);
    else router.refresh();
  }

  const allUploaded = items.filter((i) => !i.optional).every((i) => i.status);

  return (
    <div>
      <OnboardingSteps current={4} locale={locale} />
      <p className="mt-8 text-sm text-ink">
        {d.intro}
      </p>
      {error && <p role="alert" className="mt-3 text-sm text-danger"><Tr>{error}</Tr></p>}

      <div className="mt-6 divide-y divide-line border border-line">
        {items.map((item) => {
          const guidance = guidanceFor(item.code, locale);
          return (
          <div key={item.typeId} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">{referenceLabel(item.name, locale)}</span>
                {item.critical && <span className="ml-2 text-xs text-brand-strong">{d.critical}</span>}
                {item.optional && <span className="ml-2 text-xs text-muted">{d.optional}</span>}
              </div>
              <Badge status={item.status} notUploaded={d.notUploaded} />
            </div>
            {guidance && (
              <p className="mt-2 text-xs leading-relaxed text-ink">
                <span className="font-semibold text-brand-ink">{d.accepted}</span> {guidance.accepted}
              </p>
            )}
            {(item.status === "rejected" || item.status === "further_info_required") &&
              item.rejectionReason && (
                <p className="mt-2 rounded-lg bg-[#fff1f1] px-3 py-2 text-xs text-[#a2191f]">
                  <span className="font-semibold">{d.adminNote}</span> {item.rejectionReason}
                </p>
              )}
            <form onSubmit={(e) => onUpload(e, item)} className="mt-3 flex flex-wrap items-end gap-3">
              <div className="w-full sm:w-80">
                <FilePreviewInput
                  name="file"
                  variant="document"
                  required
                  aria-label={`${locale === "pt-PT" ? "Enviar" : "Upload"} ${referenceLabel(item.name, locale)}`}
                  existing={item.existing ?? null}
                />
              </div>
              <input name="referenceNumber" placeholder={d.referencePlaceholder} aria-label={d.referenceLabel} className={field} />
              <input name="issuingBody" placeholder={d.issuingPlaceholder} aria-label={d.issuingLabel} className={field} />
              <div className="text-xs text-ink">
                {d.issued}{guidance?.maxAgeMonths && <span className="text-danger"> *</span>}
                <DatePicker
                  name="issuedDate"
                  required={Boolean(guidance?.maxAgeMonths)}
                  aria-label={
                    guidance?.maxAgeMonths ? "Issue date (required)" : "Issue date"
                  }
                  className="mt-1 w-40"
                />
              </div>
              <div className="text-xs text-ink">
                {d.expiry}{item.hasExpiry && <span className="text-danger"> *</span>}
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
                className="bg-heading px-3 py-2 text-sm text-white hover:bg-[#33433a] disabled:opacity-50"
              >
                {busy === item.typeId ? d.uploading : item.status ? d.replace : d.upload}
              </button>
            </form>
          </div>
          );
        })}
      </div>

      {country === "PT" && (
        <p className="mt-6 text-sm text-ink">
          {d.bankDetails}{" "}
          <Link href="/professional/payout-details" className="font-semibold text-brand-strong hover:underline">
            {d.bankDetailsLink}
          </Link>
        </p>
      )}

      {allUploaded && (
        <div className="mt-6 border border-brand-strong bg-[#defbe6] p-4 text-sm text-[#0e6027]">
          {d.allDone}
        </div>
      )}
    </div>
  );
}
