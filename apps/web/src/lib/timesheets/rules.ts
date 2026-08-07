/**
 * Timesheet rules — pure, so the hours a professional claims and the deadline a
 * client has to respond to them are both testable without a database.
 */

/** How long a client has to review submitted hours before they auto-confirm. */
export const AUTO_CONFIRM_WORKING_DAYS = 3;

/**
 * Hours actually worked, to two decimals. Breaks are unpaid.
 */
export function workedHours(args: {
  actualStart: string;
  actualEnd: string;
  breakMinutes: number;
}): number {
  const ms = new Date(args.actualEnd).getTime() - new Date(args.actualStart).getTime();
  const hours = ms / 3_600_000 - args.breakMinutes / 60;
  return Math.round(hours * 100) / 100;
}

export type TimesheetCheck = { ok: true } | { ok: false; error: string };

/** A shift cannot be longer than this however it is logged — the same ceiling
 *  the booking form applies, so a mis-picked date cannot produce a 40-hour
 *  "shift" and a payout to match. */
export const MAX_WORKED_HOURS = 24;

/**
 * Validate submitted hours against the booking they belong to. The shift must
 * have finished, the window must be positive, breaks cannot exceed the shift,
 * and the hours must be plausible against what was booked — a professional
 * claiming three times the booked duration is a mistake or a dispute, and
 * either way an administrator should see it before it becomes a payout.
 */
export function checkSubmittedHours(args: {
  actualStart: string;
  actualEnd: string;
  breakMinutes: number;
  scheduledEnd: string;
  bookedHours: number;
  now?: Date;
}): TimesheetCheck {
  const start = new Date(args.actualStart).getTime();
  const end = new Date(args.actualEnd).getTime();
  const now = (args.now ?? new Date()).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return { ok: false, error: "Enter the time you started and finished." };
  }
  if (end <= start) return { ok: false, error: "The finish time must be after the start time." };
  if (end > now) return { ok: false, error: "You cannot log hours for a shift that has not finished." };
  if (new Date(args.scheduledEnd).getTime() > now) {
    return { ok: false, error: "This shift has not finished yet." };
  }
  if (args.breakMinutes < 0) return { ok: false, error: "Break minutes cannot be negative." };

  const hours = workedHours(args);
  if (hours <= 0) return { ok: false, error: "Your break cannot be longer than the shift." };
  if (hours > MAX_WORKED_HOURS) {
    return { ok: false, error: `A single shift cannot exceed ${MAX_WORKED_HOURS} hours.` };
  }
  if (args.bookedHours > 0 && hours > args.bookedHours * 2) {
    return {
      ok: false,
      error:
        "These hours are more than double the booking. Check the times, and contact CareBridge Connect if the shift really did overrun.",
    };
  }
  return { ok: true };
}

/** Whether the hours differ enough from the booking to be worth the client's attention. */
export function hoursDifferFromBooking(worked: number, booked: number): boolean {
  return Math.abs(worked - booked) >= 0.25;
}

/**
 * The submission cut-off for auto-confirmation: anything submitted on or before
 * this instant has had its full working-day window. Weekends do not count — a
 * Friday submission should not auto-confirm on Monday morning.
 */
export function autoConfirmCutoff(
  now: Date = new Date(),
  workingDays: number = AUTO_CONFIRM_WORKING_DAYS,
): Date {
  const cutoff = new Date(now.getTime());
  let remaining = workingDays;
  while (remaining > 0) {
    cutoff.setUTCDate(cutoff.getUTCDate() - 1);
    const day = cutoff.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return cutoff;
}
