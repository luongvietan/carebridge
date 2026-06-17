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
