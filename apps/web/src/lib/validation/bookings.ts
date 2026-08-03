import { z } from "zod";

const uuid = z.uuid();
const isoDateTime = z.iso.datetime();

/** Upper bound on a single shift. Guards against a mis-picked date producing a
 *  multi-day "shift" with a huge client charge / payout (the columns are
 *  generated from duration_hours). */
export const MAX_SHIFT_HOURS = 24;

export const createBookingSchema = z
  .object({
    requesterType: z.enum(["client", "organisation"]),
    professionalRoleId: uuid,
    // Optional: childcare roles offer a care type (overnight, after-school, …).
    // Healthcare roles have none. The DB rejects a care type from a different
    // category than the booked role (0063).
    careTypeId: uuid.optional(),
    scheduledStart: isoDateTime,
    scheduledEnd: isoDateTime,
    locationAddress: z.string().min(1),
    locationPostcode: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((v) => new Date(v.scheduledEnd).getTime() > new Date(v.scheduledStart).getTime(), {
    message: "End time must be after the start time.",
    path: ["scheduledEnd"],
  })
  .refine(
    (v) =>
      new Date(v.scheduledEnd).getTime() - new Date(v.scheduledStart).getTime() <=
      MAX_SHIFT_HOURS * 3_600_000,
    {
      message: `A shift cannot be longer than ${MAX_SHIFT_HOURS} hours.`,
      path: ["scheduledEnd"],
    },
  );
export type CreateBookingForm = z.infer<typeof createBookingSchema>;
