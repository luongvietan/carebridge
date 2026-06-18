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

export interface CyclePlan {
  /** Which reapplication cycle this next attempt belongs to (1-based). */
  cycle: number;
  /** Attempt number within that cycle (1..MAX_ATTEMPTS). */
  attemptNumber: number;
}

/**
 * Decide the cycle + attempt number for the *next* attempt given the cycles of
 * all previously completed attempts. Must only be called once the reapply lock
 * (if any) has elapsed — an active lock is handled before this point.
 *
 * - No prior attempts → cycle 1, attempt 1.
 * - Latest cycle exhausted (>= MAX_ATTEMPTS completed) → start a fresh cycle.
 * - Otherwise continue the latest cycle at the next attempt number.
 */
export function planNextCycle(completedCycles: number[], maxAttempts: number = MAX_ATTEMPTS): CyclePlan {
  if (completedCycles.length === 0) return { cycle: 1, attemptNumber: 1 };
  const latestCycle = Math.max(...completedCycles);
  const completedInLatest = completedCycles.filter((c) => c === latestCycle).length;
  if (completedInLatest >= maxAttempts) return { cycle: latestCycle + 1, attemptNumber: 1 };
  return { cycle: latestCycle, attemptNumber: completedInLatest + 1 };
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
