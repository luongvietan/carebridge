import { z } from "zod";

const uuid = z.uuid();
const isoDateTime = z.iso.datetime();

export const createBookingSchema = z
  .object({
    requesterType: z.enum(["client", "organisation"]),
    professionalRoleId: uuid,
    scheduledStart: isoDateTime,
    scheduledEnd: isoDateTime,
    locationAddress: z.string().min(1),
    locationPostcode: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((v) => new Date(v.scheduledEnd).getTime() > new Date(v.scheduledStart).getTime(), {
    message: "End time must be after the start time.",
    path: ["scheduledEnd"],
  });
export type CreateBookingForm = z.infer<typeof createBookingSchema>;
