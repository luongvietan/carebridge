import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { bookingFinance, type BookingFinance } from "./booking-finance";
import { bookingAnalytics, type BookingAnalytics } from "./analytics";

export type BookingFinanceRow = BookingFinance & {
  scheduledStart: string;
  status: string;
  roleName: string | null;
  professionalName: string | null;
  requesterName: string | null;
  requesterType: "client" | "organisation" | null;
};

export type FinanceFilters = {
  gte?: string;
  lt?: string;
  bookingStatus?: string;
  professionalId?: string;
  requesterUserId?: string;
};

export type BookingFinanceData = {
  rows: BookingFinanceRow[];
  analytics: BookingAnalytics;
  totals: { charged: number; payout: number; fee: number; refunded: number };
  /** For the filter selects. */
  professionals: { id: string; name: string }[];
  requesters: { userId: string; name: string; type: "client" | "organisation" }[];
};

/**
 * Per-booking money, with the filters the client asked for (professional,
 * client, organisation and booking status) applied on top of the existing date
 * range.
 */
export async function loadBookingFinance(
  admin: SupabaseClient<Database>,
  filters: FinanceFilters,
): Promise<BookingFinanceData> {
  let bookingsQuery = admin
    .from("bookings")
    .select(
      "id, status, scheduled_start, total_client_charge, total_payout, assigned_professional_id, requester_user_id, professional_roles(name), professionals(full_name)",
    )
    .order("scheduled_start", { ascending: false });

  if (filters.gte) bookingsQuery = bookingsQuery.gte("scheduled_start", filters.gte);
  if (filters.lt) bookingsQuery = bookingsQuery.lt("scheduled_start", filters.lt);
  if (filters.bookingStatus) {
    bookingsQuery = bookingsQuery.eq(
      "status",
      filters.bookingStatus as Database["public"]["Enums"]["booking_status"],
    );
  }
  if (filters.professionalId) {
    bookingsQuery = bookingsQuery.eq("assigned_professional_id", filters.professionalId);
  }
  if (filters.requesterUserId) {
    bookingsQuery = bookingsQuery.eq("requester_user_id", filters.requesterUserId);
  }

  const [{ data: bookings }, { data: payments }, { data: payouts }, { data: clients }, { data: organisations }, { data: professionals }] =
    await Promise.all([
      bookingsQuery,
      admin.from("payments").select("booking_id, status, amount, refunded_amount, refunded_at"),
      admin.from("payouts").select("booking_id, status, amount"),
      admin.from("private_clients").select("user_id, full_name"),
      admin.from("organisations").select("user_id, organisation_name"),
      admin.from("professionals").select("id, full_name").order("full_name"),
    ]);

  // Latest payment / payout per booking. A booking has at most one active
  // payment (0052) and one payout (0036), so first match wins.
  const paymentByBooking = new Map((payments ?? []).map((p) => [p.booking_id, p]));
  const payoutByBooking = new Map((payouts ?? []).map((p) => [p.booking_id, p]));
  const clientByUser = new Map((clients ?? []).map((c) => [c.user_id, c.full_name]));
  const orgByUser = new Map((organisations ?? []).map((o) => [o.user_id, o.organisation_name]));

  const rows: BookingFinanceRow[] = (bookings ?? []).map((b) => {
    const payment = paymentByBooking.get(b.id);
    const payout = payoutByBooking.get(b.id);
    const finance = bookingFinance({
      bookingId: b.id,
      totalClientCharge: b.total_client_charge,
      totalPayout: b.total_payout,
      bookingStatus: b.status,
      payment: payment
        ? {
            status: payment.status,
            amount: payment.amount,
            refundedAmount: payment.refunded_amount,
            refundedAt: payment.refunded_at,
          }
        : null,
      payout: payout ? { status: payout.status, amount: payout.amount } : null,
    });

    const clientName = clientByUser.get(b.requester_user_id);
    const orgName = orgByUser.get(b.requester_user_id);

    return {
      ...finance,
      scheduledStart: b.scheduled_start,
      status: b.status,
      roleName: (b.professional_roles as { name: string } | null)?.name ?? null,
      professionalName: (b.professionals as { full_name: string } | null)?.full_name ?? null,
      requesterName: clientName ?? orgName ?? null,
      requesterType: clientName ? "client" : orgName ? "organisation" : null,
    };
  });

  return {
    rows,
    analytics: bookingAnalytics(
      (bookings ?? []).map((b) => ({
        status: b.status,
        scheduledStart: b.scheduled_start,
        clientCharge: b.total_client_charge,
      })),
    ),
    totals: {
      charged: rows.reduce((sum, r) => sum + r.clientCharge, 0),
      payout: rows.reduce((sum, r) => sum + r.professionalPayout, 0),
      fee: rows.reduce((sum, r) => sum + r.platformFee, 0),
      refunded: rows.reduce((sum, r) => sum + r.refunded, 0),
    },
    professionals: (professionals ?? []).map((p) => ({ id: p.id, name: p.full_name })),
    requesters: [
      ...(clients ?? []).map((c) => ({
        userId: c.user_id,
        name: c.full_name,
        type: "client" as const,
      })),
      ...(organisations ?? []).map((o) => ({
        userId: o.user_id,
        name: o.organisation_name,
        type: "organisation" as const,
      })),
    ].sort((a, b) => a.name.localeCompare(b.name)),
  };
}
