// Helpers for the professional profile's child collections — skills/specialities
// and weekly availability. Pure and unit-tested; the server action passes raw
// form values straight through so nothing invalid reaches the database.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Weekly availability is modelled as 0 = Monday … 6 = Sunday. */
export const DAYS_OF_WEEK = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
] as const;

/** Keep only well-formed, de-duplicated skill UUIDs. */
export function parseSkillIds(raw: readonly string[]): string[] {
  return [...new Set(raw.filter((s) => UUID_RE.test(s)))];
}

/** Keep only valid weekday indices (0-6), de-duplicated and sorted. */
export function parseAvailabilityDays(raw: readonly string[]): number[] {
  const days = raw
    .map((d) => Number(d))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  return [...new Set(days)].sort((a, b) => a - b);
}
