import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type UpcomingKind = "booking" | "expiry" | "payout";

export type UpcomingEvent = {
  /** London calendar date, `YYYY-MM-DD`. */
  date: string;
  kind: UpcomingKind;
  title: string;
  detail: string | null;
  href: string;
};

export type UpcomingDay = { date: string; events: UpcomingEvent[] };

const LONDON = "Europe/London";

/** The London calendar date an instant falls on — a 23:30 UTC booking in summer
 *  belongs to the next day here, and the calendar must agree with the times
 *  shown everywhere else. */
function londonDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/**
 * What is coming up in the next `days` days: shifts to be worked, credentials
 * about to lapse, and payouts recorded but not yet paid.
 *
 * The client asked for a calendar. This returns the three streams already in the
 * database merged onto one timeline rather than a new scheduling concept — a
 * calendar that invented its own events would drift from the bookings and
 * expiries it is supposed to reflect.
 */
export async function loadUpcoming(
  admin: SupabaseClient<Database>,
  days = 30,
): Promise<UpcomingDay[]> {
  const now = new Date();
  const horizon = new Date(now.getTime() + days * 86_400_000);
  const todayDate = londonDate(now.toISOString());
  const horizonDate = londonDate(horizon.toISOString());

  const [{ data: bookings }, { data: documents }, { data: payouts }] = await Promise.all([
    admin
      .from("bookings")
      .select("id, scheduled_start, status, location_address, professional_roles(name), professionals(full_name)")
      .gte("scheduled_start", now.toISOString())
      .lte("scheduled_start", horizon.toISOString())
      .not("status", "in", "(cancelled,no_show)")
      .order("scheduled_start"),
    admin
      .from("documents")
      .select("id, expiry_date, professional_id, document_types(name), professionals(full_name)")
      .eq("verification_status", "approved")
      .is("superseded_at", null)
      .gte("expiry_date", todayDate)
      .lte("expiry_date", horizonDate)
      .order("expiry_date"),
    admin
      .from("payouts")
      .select("id, amount, created_at, booking_id, status, professionals(full_name)")
      .eq("status", "recorded")
      .order("created_at"),
  ]);

  const events: UpcomingEvent[] = [];

  for (const booking of bookings ?? []) {
    events.push({
      date: londonDate(booking.scheduled_start),
      kind: "booking",
      title: (booking.professional_roles as { name: string } | null)?.name ?? "Booking",
      detail:
        (booking.professionals as { full_name: string } | null)?.full_name ??
        `${booking.status.replace(/_/g, " ")} · ${booking.location_address}`,
      href: "/admin/bookings",
    });
  }

  for (const doc of documents ?? []) {
    if (!doc.expiry_date) continue;
    events.push({
      date: doc.expiry_date,
      kind: "expiry",
      title: (doc.document_types as { name: string } | null)?.name ?? "Document",
      detail: (doc.professionals as { full_name: string } | null)?.full_name ?? null,
      href: "/admin/compliance",
    });
  }

  // Payouts have no due date of their own: a recorded payout is due now, so it
  // is shown today rather than invented into the future.
  for (const payout of payouts ?? []) {
    events.push({
      date: todayDate,
      kind: "payout",
      title: "Payout awaiting payment",
      detail: (payout.professionals as { full_name: string } | null)?.full_name ?? null,
      href: "/admin/finance/payouts",
    });
  }

  const byDate = new Map<string, UpcomingEvent[]>();
  for (const event of events) {
    const list = byDate.get(event.date) ?? [];
    list.push(event);
    byDate.set(event.date, list);
  }

  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, dayEvents]) => ({ date, events: dayEvents }));
}
