/**
 * Booking and revenue analytics for the finance screen (client request, 7 Aug):
 * completion and cancellation rates, average booking value, and the month-on-
 * month trend.
 *
 * Pure, so the definitions are pinned by tests. Rates in particular are easy to
 * quietly change meaning — "completion rate" over all bookings including ones
 * still in the future would drift downwards every time somebody books ahead.
 */

export type BookingForAnalytics = {
  status: string;
  scheduledStart: string;
  clientCharge: number | null;
  /** Defaults to GBP; amounts are never summed across currencies. */
  currency?: string;
};

export type MonthlyPoint = {
  /** `YYYY-MM`. */
  month: string;
  bookings: number;
  /** Completed-booking charges for the month, one total per currency present. */
  revenueByCurrency: Record<string, number>;
};

export type BookingAnalytics = {
  total: number;
  /** Bookings that have reached an end state — the denominator for the rates. */
  concluded: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
  cancellationRate: number;
  /** Mean completed-booking charge, one figure per currency present. */
  averageBookingValueByCurrency: Record<string, number>;
  monthly: MonthlyPoint[];
  /** Change in booking count from the previous month, as a percentage. */
  monthOnMonthGrowth: number | null;
};

const CONCLUDED = new Set(["completed", "cancelled", "no_show"]);

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function addAmount(record: Record<string, number>, currency: string, amount: number): void {
  record[currency] = (record[currency] ?? 0) + amount;
}

export function bookingAnalytics(
  bookings: BookingForAnalytics[],
  monthsBack = 6,
  now: Date = new Date(),
): BookingAnalytics {
  const completed = bookings.filter((b) => b.status === "completed");
  const cancelled = bookings.filter((b) => b.status === "cancelled");
  const noShow = bookings.filter((b) => b.status === "no_show");
  // Rates are over bookings that actually finished one way or another. A booking
  // still in the future is not a failure to complete.
  const concluded = bookings.filter((b) => CONCLUDED.has(b.status)).length;

  const completedValueByCurrency: Record<string, number> = {};
  for (const b of completed) {
    addAmount(completedValueByCurrency, b.currency ?? "GBP", Number(b.clientCharge ?? 0));
  }

  const months: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }

  const monthly: MonthlyPoint[] = months.map((month) => {
    const inMonth = bookings.filter((b) => monthKey(b.scheduledStart) === month);
    const revenueByCurrency: Record<string, number> = {};
    for (const b of inMonth.filter((b) => b.status === "completed")) {
      addAmount(revenueByCurrency, b.currency ?? "GBP", Number(b.clientCharge ?? 0));
    }
    return { month, bookings: inMonth.length, revenueByCurrency };
  });

  const thisMonth = monthly.at(-1)?.bookings ?? 0;
  const lastMonth = monthly.at(-2)?.bookings ?? 0;
  const monthOnMonthGrowth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10 : null;

  const averageBookingValueByCurrency = Object.fromEntries(
    Object.entries(completedValueByCurrency).map(([currency, total]) => {
      const count = completed.filter((b) => (b.currency ?? "GBP") === currency).length;
      return [currency, Math.round((total / count) * 100) / 100];
    }),
  );

  return {
    total: bookings.length,
    concluded,
    completed: completed.length,
    cancelled: cancelled.length,
    noShow: noShow.length,
    completionRate: pct(completed.length, concluded),
    cancellationRate: pct(cancelled.length, concluded),
    averageBookingValueByCurrency,
    monthly,
    monthOnMonthGrowth,
  };
}
