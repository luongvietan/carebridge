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
