const PASS_THRESHOLD = 80;
export const MAX_ATTEMPTS = 3;
const REAPPLY_LOCK_MONTHS = 3;

/** Percentage of correct answers, rounded to 2 decimals. Empty input scores 0. */
export function scorePercent(results: boolean[]): number {
  if (results.length === 0) return 0;
  const correct = results.filter(Boolean).length;
  return Math.round((correct / results.length) * 10000) / 100;
}

export function isPass(score: number): boolean {
  return score >= PASS_THRESHOLD;
}

export interface AttemptState {
  canRetry: boolean;
  lockUntil: Date | null;
}

/**
 * After an attempt: a pass ends the process; a fail allows retry until MAX_ATTEMPTS,
 * after which the applicant is locked out for REAPPLY_LOCK_MONTHS.
 */
export function nextAttemptState(attemptNumber: number, passed: boolean, now: Date = new Date()): AttemptState {
  if (passed) return { canRetry: false, lockUntil: null };
  if (attemptNumber >= MAX_ATTEMPTS) {
    const lockUntil = new Date(now);
    lockUntil.setMonth(lockUntil.getMonth() + REAPPLY_LOCK_MONTHS);
    return { canRetry: false, lockUntil };
  }
  return { canRetry: true, lockUntil: null };
}
