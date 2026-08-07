export type DocumentExpiryCheck = { ok: true } | { ok: false; error: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Documents whose type carries an expiry (DBS, professional registration,
 * insurance, training certificates, …) MUST be uploaded with a valid, current
 * expiry date. Without it the daily compliance sweep — which only acts on rows
 * where `expiry_date is not null` — can never expire or alert on the document,
 * so a lapsed certificate would stay "approved" forever. An expiry already in
 * the past is rejected too: an out-of-date certificate provides no compliance
 * value and would be swept to `expired` immediately.
 *
 * `today` is injectable for deterministic tests; ISO `YYYY-MM-DD` strings sort
 * lexicographically in chronological order, so a string compare is sufficient.
 */
export function validateDocumentExpiry(args: {
  hasExpiry: boolean;
  expiryDate: string | null | undefined;
  today?: string;
}): DocumentExpiryCheck {
  if (!args.hasExpiry) return { ok: true };

  const value = (args.expiryDate ?? "").trim();
  if (!value) {
    return { ok: false, error: "An expiry date is required for this document." };
  }
  if (!ISO_DATE.test(value) || Number.isNaN(Date.parse(value))) {
    return { ok: false, error: "Enter a valid expiry date." };
  }
  if (value < (args.today ?? todayIso())) {
    return { ok: false, error: "The expiry date must be today or in the future." };
  }
  return { ok: true };
}

/**
 * Some documents prove nothing by having an expiry date — a utility bill is
 * evidence of where somebody lived when it was ISSUED. For those the client
 * asked for a recency rule instead: generally issued within the last 3 months
 * (`maxAgeMonths`, from DOCUMENT_GUIDANCE).
 *
 * A document dated in the future is rejected as well; that is a typo or a
 * fabrication, and either way it should not pass review.
 */
export function validateDocumentIssueDate(args: {
  maxAgeMonths: number | undefined;
  issuedDate: string | null | undefined;
  today?: string;
}): DocumentExpiryCheck {
  if (!args.maxAgeMonths) return { ok: true };

  const value = (args.issuedDate ?? "").trim();
  if (!value) {
    return { ok: false, error: "An issue date is required for this document." };
  }
  if (!ISO_DATE.test(value) || Number.isNaN(Date.parse(value))) {
    return { ok: false, error: "Enter a valid issue date." };
  }

  const today = args.today ?? todayIso();
  if (value > today) {
    return { ok: false, error: "The issue date cannot be in the future." };
  }

  const earliest = new Date(`${today}T00:00:00Z`);
  earliest.setUTCMonth(earliest.getUTCMonth() - args.maxAgeMonths);
  if (value < earliest.toISOString().slice(0, 10)) {
    return {
      ok: false,
      error: `This document must have been issued within the last ${args.maxAgeMonths} months.`,
    };
  }
  return { ok: true };
}
