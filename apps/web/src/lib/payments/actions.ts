"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAuth } from "@/lib/auth/require-auth";
import { stripe } from "@/lib/stripe/client";
import { buildCheckoutLineItems } from "@/lib/stripe/checkout";

export type PaymentActionResult = { ok: true; url?: string } | { error: string };

export async function startCheckout(bookingId: string): Promise<PaymentActionResult> {
  const user = await requireAuth();
  const admin = createServiceClient();

  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, requester_user_id, total_client_charge, snap_currency, professional_roles(name)")
    .eq("id", bookingId)
    .single();
  if (!booking) return { error: "Booking not found." };
  if (booking.requester_user_id !== user.id) return { error: "This is not your booking." };
  if (!["accepted", "assigned"].includes(booking.status)) {
    return { error: "This booking is not ready for payment." };
  }

  if (await alreadyPaid(admin, bookingId)) return { error: "This booking is already paid." };

  // Reuse an outstanding pending payment for this booking (at most one exists —
  // enforced by uq_payments_active_booking). Don't reuse failed/refunded rows.
  const { data: existing } = await admin
    .from("payments")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("status", "pending")
    .maybeSingle();

  let paymentId = existing?.id ?? null;
  if (!paymentId) {
    const { data: created, error } = await admin
      .from("payments")
      .insert({ booking_id: bookingId, payer_user_id: user.id, amount: Number(booking.total_client_charge), currency: booking.snap_currency, status: "pending" })
      .select("id")
      .single();
    if (error || !created) {
      // A concurrent request won the race and created the pending payment first
      // (unique-violation). Reuse that row instead of opening a second charge.
      if (error?.code === "23505") {
        const { data: race } = await admin
          .from("payments")
          .select("id")
          .eq("booking_id", bookingId)
          .eq("status", "pending")
          .maybeSingle();
        paymentId = race?.id ?? null;
      }
      if (!paymentId) return { error: error?.message ?? "Could not start payment." };
    } else {
      paymentId = created.id;
    }
  }

  const roleName = (booking.professional_roles as { name: string } | null)?.name ?? "professional";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000";
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: buildCheckoutLineItems({ total_client_charge: Number(booking.total_client_charge), snap_currency: booking.snap_currency, role_name: roleName }),
    success_url: `${appUrl}/client/bookings?paid=1`,
    cancel_url: `${appUrl}/client/bookings?paid=0`,
    metadata: { booking_id: bookingId, payment_id: paymentId },
    payment_intent_data: { metadata: { booking_id: bookingId, payment_id: paymentId } },
  });

  await admin.from("payments").update({ stripe_payment_intent_id: (session.payment_intent as string) ?? null }).eq("id", paymentId);
  return { ok: true, url: session.url ?? undefined };
}

async function alreadyPaid(admin: ReturnType<typeof createServiceClient>, bookingId: string): Promise<boolean> {
  const { count } = await admin.from("payments").select("id", { count: "exact", head: true }).eq("booking_id", bookingId).eq("status", "succeeded");
  return (count ?? 0) > 0;
}
