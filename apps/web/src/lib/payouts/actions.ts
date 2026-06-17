"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { requireAuth } from "@/lib/auth/require-auth";
import { nextPayoutStatus, type PayoutStatus } from "./record";
import { sendNotification } from "@/lib/notifications/send";

export type PayoutResult = { ok: true } | { error: string };

/** Professional saves their (encrypted) bank details. */
export async function savePayoutDetails(form: {
  accountName: string; sortCode: string; accountNumber: string;
}): Promise<PayoutResult> {
  const user = await requireAuth();
  const key = process.env.PAYOUT_ENC_KEY;
  if (!key) return { error: "Payout encryption is not configured." };

  const admin = createServiceClient();
  const { data: prof } = await admin.from("professionals").select("id").eq("user_id", user.id).maybeSingle();
  if (!prof) return { error: "Professional profile not found." };

  const { error } = await admin.rpc("set_payout_details", {
    p_professional_id: prof.id, p_account_name: form.accountName,
    p_sort_code: form.sortCode, p_account_number: form.accountNumber, p_key: key,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

/** Admin records a payout for a completed + paid booking (amount = total_payout). */
export async function recordPayout(bookingId: string): Promise<PayoutResult> {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();

  const { data: booking } = await admin
    .from("bookings").select("id, status, assigned_professional_id, total_payout").eq("id", bookingId).single();
  if (!booking) return { error: "Booking not found." };
  if (booking.status !== "completed") return { error: "Booking is not completed." };
  if (!booking.assigned_professional_id) return { error: "Booking has no assigned professional." };

  const { count: paid } = await admin.from("payments")
    .select("id", { count: "exact", head: true }).eq("booking_id", bookingId).eq("status", "succeeded");
  if ((paid ?? 0) === 0) return { error: "The client payment has not succeeded yet." };

  const { count: existing } = await admin.from("payouts")
    .select("id", { count: "exact", head: true }).eq("booking_id", bookingId);
  if ((existing ?? 0) > 0) return { error: "A payout already exists for this booking." };

  const { error } = await admin.from("payouts").insert({
    professional_id: booking.assigned_professional_id, booking_id: bookingId,
    amount: Number(booking.total_payout), status: "recorded", recorded_by: adminId, recorded_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  await admin.from("audit_log").insert({ actor_user_id: adminId, actor_type: "admin", action: "payout.recorded", entity_type: "booking", entity_id: bookingId });
  const { data: proRow } = await admin.from("professionals").select("user_id").eq("id", booking.assigned_professional_id).maybeSingle();
  if (proRow?.user_id) {
    await sendNotification("payout_recorded", proRow.user_id, { booking_id: bookingId, amount: String(booking.total_payout) });
  }
  return { ok: true };
}

/** Admin marks a recorded payout as paid (out-of-band bank transfer). */
export async function markPayoutPaid(payoutId: string, method: string, reference: string): Promise<PayoutResult> {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const ALLOWED_METHODS = ["bank_transfer", "bacs", "faster_payments", "cheque"];
  if (!ALLOWED_METHODS.includes(method)) return { error: "Invalid payout method." };
  const admin = createServiceClient();
  const { data: payout } = await admin.from("payouts").select("id, status").eq("id", payoutId).single();
  if (!payout) return { error: "Payout not found." };

  let newStatus: PayoutStatus;
  try {
    newStatus = nextPayoutStatus(payout.status as PayoutStatus, "mark_paid");
  } catch {
    return { error: "Only a recorded payout can be marked paid." };
  }

  const { error } = await admin.from("payouts")
    .update({ status: newStatus, method, reference, paid_at: new Date().toISOString() }).eq("id", payoutId);
  if (error) return { error: error.message };
  await admin.from("audit_log").insert({ actor_user_id: adminId, actor_type: "admin", action: "payout.paid", entity_type: "payout", entity_id: payoutId });
  return { ok: true };
}
