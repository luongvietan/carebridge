/**
 * Pure builder for the CareBridge Connect Competency Assessment Certificate.
 * Returns certificate data only for a passed, completed attempt; otherwise null.
 */

export type CertificateInput = {
  fullName: string;
  roleName: string;
  attempt: {
    id: string;
    score: number | null;
    passed: boolean | null;
    completed_at: string | null;
  };
};

export type Certificate = {
  fullName: string;
  roleName: string;
  score: number;
  dateCompleted: string;
  certificateNumber: string;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Format an ISO timestamp as e.g. "18 June 2026" (UTC, locale-independent). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Stable, human-readable certificate number derived from the attempt id. */
function certificateNumber(attemptId: string): string {
  return `CBC-${attemptId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function buildCertificate(input: CertificateInput): Certificate | null {
  const { attempt } = input;
  if (!attempt.passed || !attempt.completed_at || attempt.score == null) return null;
  return {
    fullName: input.fullName,
    roleName: input.roleName,
    score: attempt.score,
    dateCompleted: formatDate(attempt.completed_at),
    certificateNumber: certificateNumber(attempt.id),
  };
}
