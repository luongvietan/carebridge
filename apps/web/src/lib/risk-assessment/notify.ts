import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendNotification } from "@/lib/notifications/send";

/** E-mail every admin (and the founder) that a booking request is waiting for review — no health detail. */
export async function notifyAdminsOfReview(bookingId: string): Promise<void> {
  const admin = createServiceClient();
  const { data: admins } = await admin
    .from("users")
    .select("id")
    .or("account_type.eq.admin,is_founder.eq.true")
    .eq("account_status", "active");
  await Promise.all(
    (admins ?? []).map((a) => sendNotification("booking_review_required", a.id, { booking_id: bookingId })),
  );
}
