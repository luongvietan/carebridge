import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendNotification } from "@/lib/notifications/send";

/**
 * E-mail every professional of the booking's role who can currently accept
 * work — spec item 7: professionals hear when matching work becomes available.
 * Called when a booking opens: at creation, or when an admin approves a
 * request the risk assessment held for review.
 */
export async function notifyMatchingProfessionals(bookingId: string, professionalRoleId: string): Promise<void> {
  const admin = createServiceClient();
  const { data: matches } = await admin
    .from("professional_role_assignments")
    .select("professionals(user_id, can_accept_bookings)")
    .eq("professional_role_id", professionalRoleId)
    .eq("status", "active");
  await Promise.all(
    (matches ?? [])
      .map((m) => m.professionals as { user_id: string | null; can_accept_bookings: boolean | null } | null)
      .filter((p) => p?.can_accept_bookings)
      .map((p) => p?.user_id)
      .filter((id): id is string => Boolean(id))
      .map((id) => sendNotification("booking_available", id, { booking_id: bookingId })),
  );
}
