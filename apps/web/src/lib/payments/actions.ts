"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { stripe } from "@/lib/stripe/client";
import { buildCheckoutLineItems } from "@/lib/stripe/checkout";

export type PaymentActionResult = { ok: true; url?: string } | { error: string };

async function authUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function startCheckout(bookingId: string): Promise<PaymentActionResult> {
  const user = await authUser();
  if (!user) return { error: "You must be signed in." };
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

  const { data: existing } = await admin
    .from("payments")
    .select("id, status")
    .eq("booking_id", bookingId)
    .neq("status", "succeeded")
    .order("created_at", { ascending: false })
    .maybeSingle();

  let paymentId = existing?.id ?? null;
  if (!paymentId) {
    const { data: created, error } = await admin
      .from("payments")
      .insert({ booking_id: bookingId, payer_user_id: user.id, amount: Number(booking.total_client_charge), currency: booking.snap_currency, status: "pending" })
      .select("id")
      .single();
    if (error || !created) return { error: error?.message ?? "Could not start payment." };
    paymentId = created.id;
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

export async function refundPayment(paymentId: string): Promise<PaymentActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();
  const { data: payment } = await admin.from("payments").select("id, stripe_payment_intent_id, status").eq("id", paymentId).single();
  if (!payment) return { error: "Payment not found." };
  if (payment.status !== "succeeded") return { error: "Only a succeeded payment can be refunded." };
  if (!payment.stripe_payment_intent_id) return { error: "No Stripe payment intent on this payment." };

  try {
    await stripe().refunds.create({ payment_intent: payment.stripe_payment_intent_id });
  } catch (e) {
    return { error: `Refund failed: ${(e as Error).message}` };
  }
  await admin.from("audit_log").insert({ actor_user_id: adminId, actor_type: "admin", action: "payment.refund_requested", entity_type: "payment", entity_id: paymentId });
  return { ok: true };
}
