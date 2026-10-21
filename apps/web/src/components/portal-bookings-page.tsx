import { TableScroll } from "@/components/table-scroll";
import { PaymentReturnNotice } from '@/components/payment-return-notice';
import { AdminTableHeader } from "@/components/admin-table-header";
import { getPortalLocale, getPortalT } from "@/lib/i18n/portal-server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { BookingCancelButton } from "@/components/booking-cancel-button";
import { PayNowButton } from "@/components/pay-now-button";
import { formatMoney } from "@/lib/format/money";
import { formatLondon } from "@/lib/format/datetime";
import { ReviewHoursPanel, type HoursForReview } from "@/components/timesheet-forms";

export const dynamic = "force-dynamic";

const CANCELLABLE = new Set(["open", "accepted", "assigned"]);
const PAYABLE = new Set(["accepted", "assigned"]);

export async function PortalBookingsPage({ newBookingHref }: { newBookingHref: string }) {
  const [{ t }, locale, supabase, admin] = await Promise.all([
    getPortalT().then((t) => ({ t })),
    getPortalLocale(),
    createClient(),
    Promise.resolve(createServiceClient()),
  ]);

  const [{ data: bookings }, { data: roles }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, status, scheduled_start, scheduled_end, duration_hours, location_address, professional_role_id, total_client_charge, snap_currency",
      )
      .order("scheduled_start", { ascending: false }),
    supabase.from("professional_roles").select("id, name"),
  ]);

  const roleNames = new Map((roles ?? []).map((r) => [r.id, t(r.name)]));

  // Load latest payment status per booking via service client (payments is admin-RLS).
  const bookingIds = (bookings ?? []).map((b) => b.id);
  const paymentStatusByBooking = new Map<string, string>();
  if (bookingIds.length > 0) {
    const { data: payments } = await admin
      .from("payments")
      .select("booking_id, status, created_at")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });

    // Pick the most recent payment per booking.
    const seen = new Set<string>();
    for (const p of payments ?? []) {
      if (!seen.has(p.booking_id)) {
        paymentStatusByBooking.set(p.booking_id, p.status);
        seen.add(p.booking_id);
      }
    }
  }

  // Hours submitted against this account's bookings, waiting to be confirmed
  // before the professional's payout can be released.
  const submittedSheets = bookingIds.length
    ? (
        await admin
          .from("timesheets")
          .select(
            "id, booking_id, actual_start, actual_end, break_minutes, worked_hours, professional_note, status, professionals(full_name)",
          )
          .in("booking_id", bookingIds)
          .eq("status", "submitted")
      ).data
    : [];
  const bookingById = new Map((bookings ?? []).map((b) => [b.id, b]));
  const hoursForReview: HoursForReview[] = (submittedSheets ?? []).map((sheet) => {
    const booking = bookingById.get(sheet.booking_id);
    return {
      timesheetId: sheet.id,
      bookingId: sheet.booking_id,
      professionalName:
        (sheet.professionals as { full_name: string } | null)?.full_name ?? t("The professional"),
      scheduledStart: booking?.scheduled_start ?? sheet.actual_start,
      bookedHours: Number(booking?.duration_hours ?? 0),
      workedHours: Number(sheet.worked_hours ?? 0),
      breakMinutes: sheet.break_minutes,
      actualStart: sheet.actual_start,
      actualEnd: sheet.actual_end,
      note: sheet.professional_note,
    };
  });

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="mt-1 text-3xl font-bold">{t("Bookings")}</h1>
        <Link
          href={newBookingHref}
          className="rounded-full bg-brand-strong px-4 py-3 text-sm text-white hover:bg-brand-strong-hover"
        >
          {t("New booking")}
        </Link>
      </div>

      <PaymentReturnNotice />
      {hoursForReview.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">{t("Hours awaiting your confirmation")}</h2>
          <p className="mt-2 text-sm text-ink">
            {t("Confirm the hours worked so the professional can be paid. If you do not respond within three working days they are confirmed automatically.")}
          </p>
          <ReviewHoursPanel items={hoursForReview} />
        </section>
      )}

      {bookings && bookings.length > 0 ? (
        <TableScroll className="mt-8 rounded-2xl border border-line shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <table className="w-full text-sm">
            <AdminTableHeader>
              <tr>
                <th className="p-3 font-medium">{t("Date")}</th>
                <th className="p-3 font-medium">{t("Role")}</th>
                <th className="p-3 font-medium">{t("Status")}</th>
                <th className="p-3 font-medium">{t("Total")}</th>
                <th className="p-3 font-medium">{t("Payment")}</th>
                <th scope="col" className="p-3 font-medium"><span className="sr-only">{t("Actions")}</span></th>
              </tr>
            </AdminTableHeader>
            <tbody className="divide-y divide-line">
              {bookings.map((b) => {
                const payStatus = paymentStatusByBooking.get(b.id) ?? null;
                const needsPay = PAYABLE.has(b.status) && payStatus !== "succeeded" && payStatus !== "refunded";
                return (
                  <tr key={b.id}>
                    <td className="p-3">{formatLondon(b.scheduled_start, locale)}</td>
                    <td className="p-3">{roleNames.get(b.professional_role_id) ?? b.professional_role_id}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink">
                        {t(b.status.replace(/_/g, " "))}
                      </span>
                    </td>
                    <td className="p-3">{formatMoney(b.total_client_charge, b.snap_currency ?? "GBP")}</td>
                    <td className="p-3">
                      {payStatus ? (
                        <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink">
                          {t(payStatus.replace(/_/g, " "))}
                        </span>
                      ) : (
                        <span className="text-ink">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex flex-col items-end gap-1">
                        {needsPay && <PayNowButton bookingId={b.id} />}
                        {CANCELLABLE.has(b.status) && <BookingCancelButton bookingId={b.id} />}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      ) : (
        <section className="mt-8 rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-semibold text-brand-ink">{t("No bookings yet.")}</h2>
          <Link href={newBookingHref} className="mt-3 inline-block text-brand-strong underline underline-offset-4">{t("New booking")}</Link>
        </section>
      )}
    </main>
  );
}
