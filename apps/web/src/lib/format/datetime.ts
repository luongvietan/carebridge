/** CareBridge operates in the UK; all booking wall-clock times are London time. */
export const APP_TIME_ZONE = "Europe/London";

/** Offset (ms) of `timeZone` from UTC at the given instant (positive = ahead of UTC). */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(instant).map((p) => [p.type, p.value]));
  const hour = parts.hour === "24" ? "00" : parts.hour; // some engines emit "24" at midnight
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - instant.getTime();
}

/**
 * Interpret a wall-clock string "YYYY-MM-DDTHH:mm" as Europe/London local time
 * and return the corresponding UTC instant — independent of the runtime's own
 * timezone. (Using `new Date(wallClock)` interprets it in the browser/server
 * local zone, which silently drifts bookings for anyone not on UK time.)
 *
 * Returns null for malformed input.
 */
export function londonWallClockToUtc(wallClock: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(wallClock);
  if (!m) return null;
  const naiveUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  // Correct the naive UTC reading by the zone offset in effect at that wall time.
  const offset = zoneOffsetMs(new Date(naiveUtc), APP_TIME_ZONE);
  const result = new Date(naiveUtc - offset);
  return Number.isNaN(result.getTime()) ? null : result;
}
