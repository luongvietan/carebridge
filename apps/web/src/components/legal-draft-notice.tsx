import { LEGAL_DRAFT_NOTICE_PT } from "@/data/legal-copy-pt";

/** Shown on every Portuguese legal page until a lawyer has approved the texts. */
export function LegalDraftNotice() {
  return (
    <p
      role="note"
      className="mb-8 rounded-xl border border-[#f0d9a8] bg-[#fff8e8] px-4 py-3 text-sm leading-relaxed text-[#6b4e12]"
    >
      {LEGAL_DRAFT_NOTICE_PT}
    </p>
  );
}
