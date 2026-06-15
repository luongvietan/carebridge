import { z } from "zod";

export const createBookingSchema = z.object({
  requesterType: z.enum(["client", "organisation"]),
  professionalRoleId: z.string().uuid(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  locationAddress: z.string().min(1),
  locationPostcode: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateBookingForm = z.infer<typeof createBookingSchema>;
