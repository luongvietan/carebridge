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
};

export type MonthlyPoint = {
  /** `YYYY-MM`. */
  month: string;
  bookings: number;
  revenue: number;
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
  averageBookingValue: number;
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

  const completedValue = completed.reduce((sum, b) => sum + Number(b.clientCharge ?? 0), 0);

  const months: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }

  const monthly: MonthlyPoint[] = months.map((month) => {
    const inMonth = bookings.filter((b) => monthKey(b.scheduledStart) === month);
    return {
      month,
      bookings: inMonth.length,
      revenue: inMonth
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + Number(b.clientCharge ?? 0), 0),
    };
  });

  const thisMonth = monthly.at(-1)?.bookings ?? 0;
  const lastMonth = monthly.at(-2)?.bookings ?? 0;
  const monthOnMonthGrowth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10 : null;

  return {
    total: bookings.length,
    concluded,
    completed: completed.length,
    cancelled: cancelled.length,
    noShow: noShow.length,
    completionRate: pct(completed.length, concluded),
    cancellationRate: pct(cancelled.length, concluded),
    averageBookingValue: completed.length
      ? Math.round((completedValue / completed.length) * 100) / 100
      : 0,
    monthly,
    monthOnMonthGrowth,
  };
}
