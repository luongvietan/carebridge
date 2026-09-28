/**
 * A small per-visitor limiter for the public assistant endpoint. In-memory, so
 * it is per server instance — enough to stop a script draining the model
 * budget from one address, not a substitute for a shared store if abuse grows.
 */
const hits = new Map<string, number[]>();

export function allowRequest(
  key: string,
  limit = 20,
  windowMs = 10 * 60_000,
  now = Date.now(),
): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return true;
}
