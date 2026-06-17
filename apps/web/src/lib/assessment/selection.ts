/**
 * Randomly pick up to `n` unique items from `pool` (Fisher–Yates shuffle).
 * Returns all items (shuffled) when the pool is smaller than `n`.
 */
export function pickQuestions<T>(pool: readonly T[], n: number, rng: () => number = Math.random): T[] {
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.max(0, Math.min(n, arr.length)));
}

/**
 * Pick `commonN` questions from the common pool plus `roleN` from the
 * role-specific pool (CareBridge MVP format: 15 common + 5 role-specific).
 * Each pool is shuffled independently. Any role-specific shortfall (sparse
 * role bank, or role not yet chosen) is topped up from the common pool so the
 * assessment still reaches the intended total of `commonN + roleN` whenever the
 * combined pool is large enough.
 */
export function pickStratified<T>(
  common: readonly T[],
  roleSpecific: readonly T[],
  commonN: number,
  roleN: number,
  rng: () => number = Math.random,
): T[] {
  const role = pickQuestions(roleSpecific, roleN, rng);
  const commonNeeded = commonN + (roleN - role.length);
  return [...pickQuestions(common, commonNeeded, rng), ...role];
}
