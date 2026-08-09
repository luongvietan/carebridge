import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { londonDateRangeToUtc } from "@/lib/format/datetime";

export type DashboardMetrics = {
  professionals: number;
  activeProfessionals: number;
  clients: number;
  organisations: number;
  /** Documents sitting in the review queue. */
  documentsAwaitingReview: number;
  /** Professionals whose application has not been approved yet. */
  applicationsAwaitingApproval: number;
  activeBookings: number;
  restrictedProfessionals: number;
  /** Platform margin on bookings paid for this calendar month. */
  monthlyRevenue: number;
};

export type NotificationItem = {
  key: string;
  label: string;
  count: number;
  href: string;
  tone: "neutral" | "amber" | "red";
};

/** Bookings that are live work — requested, staffed or under way. */
const ACTIVE_BOOKING_STATUSES = [
  "open",
  "accepted",
  "assigned",
  "in_progress",
] as const satisfies readonly Database["public"]["Enums"]["booking_status"][];

/**
 * The at-a-glance figures for the admin dashboard (client request, 7 Aug).
 *
 * Monthly revenue is deliberately computed the same way the finance page
 * computes platform revenue — the platform margin on bookings whose payment
 * succeeded — so the dashboard and the finance page cannot disagree.
 */
export async function loadDashboardMetrics(
  admin: SupabaseClient<Database>,
): Promise<DashboardMetrics> {
  const now = new Date();
  const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);
  const { gte, lt } = londonDateRangeToUtc(monthStart, monthEnd);

  const [
    { count: professionals },
    { count: activeProfessionals },
    { count: clients },
    { count: organisations },
    { count: documentsAwaitingReview },
    { count: applicationsAwaitingApproval },
    { count: activeBookings },
    { count: restrictedProfessionals },
    { data: monthPayments },
    { data: revenueRows },
  ] = await Promise.all([
    admin.from("professionals").select("id", { count: "exact", head: true }),
    admin
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .eq("professional_status", "active"),
    admin.from("private_clients").select("id", { count: "exact", head: true }),
    admin.from("organisations").select("id", { count: "exact", head: true }),
    admin
      .from("documents")
      .select("id", { count: "exact", head: true })
      .in("verification_status", ["pending_review", "further_info_required"])
      .is("superseded_at", null),
    admin
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .eq("professional_status", "pending_verification"),
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("status", ACTIVE_BOOKING_STATUSES),
    admin
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .eq("professional_status", "booking_restricted"),
    (() => {
      let query = admin.from("payments").select("booking_id, status");
      if (gte) query = query.gte("created_at", gte);
      if (lt) query = query.lt("created_at", lt);
      return query;
    })(),
    admin.from("v_platform_revenue").select("booking_id, platform_revenue"),
  ]);

  const paidBookingIds = new Set(
    (monthPayments ?? []).filter((p) => p.status === "succeeded").map((p) => p.booking_id),
  );
  const monthlyRevenue = (revenueRows ?? [])
    .filter((r) => r.booking_id && paidBookingIds.has(r.booking_id))
    .reduce((sum, r) => sum + Number(r.platform_revenue ?? 0), 0);

  return {
    professionals: professionals ?? 0,
    activeProfessionals: activeProfessionals ?? 0,
    clients: clients ?? 0,
    organisations: organisations ?? 0,
    documentsAwaitingReview: documentsAwaitingReview ?? 0,
    applicationsAwaitingApproval: applicationsAwaitingApproval ?? 0,
    activeBookings: activeBookings ?? 0,
    restrictedProfessionals: restrictedProfessionals ?? 0,
    monthlyRevenue,
  };
}

/**
 * The notifications centre: everything waiting on an administrator, each item
 * linking to the screen where it is dealt with. Derived from live data rather
 * than a notifications table, so an item disappears the moment it is handled
 * and nothing can be left "unread" while the underlying work is done.
 */
export async function loadNotificationItems(
  admin: SupabaseClient<Database>,
  expiringWithin30Days: number,
): Promise<NotificationItem[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [
    { count: newRegistrations },
    { count: documentsToReview },
    { count: newBookingRequests },
    { count: cancelledBookings },
    { count: failedPayments },
    { count: hoursToConfirm },
  ] = await Promise.all([
    admin
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .eq("professional_status", "pending_verification"),
    admin
      .from("documents")
      .select("id", { count: "exact", head: true })
      .in("verification_status", ["pending_review", "further_info_required"])
      .is("superseded_at", null),
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled")
      .gte("updated_at", sevenDaysAgo),
    admin
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed"),
    admin
      .from("timesheets")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
  ]);

  const items: NotificationItem[] = [
    {
      key: "registrations",
      label: "New registrations awaiting approval",
      count: newRegistrations ?? 0,
      href: "/admin/users?professionalStatus=pending_verification",
      tone: "neutral",
    },
    {
      key: "documents",
      label: "Documents awaiting review",
      count: documentsToReview ?? 0,
      href: "/admin/compliance",
      tone: "neutral",
    },
    {
      key: "expiring",
      label: "Compliance documents expiring within 30 days",
      count: expiringWithin30Days,
      href: "/admin/compliance",
      tone: "amber",
    },
    {
      key: "bookings",
      label: "Booking requests still unfilled",
      count: newBookingRequests ?? 0,
      href: "/admin/bookings",
      tone: "neutral",
    },
    {
      key: "hours",
      label: "Hours submitted awaiting client confirmation",
      count: hoursToConfirm ?? 0,
      href: "/admin/bookings",
      tone: "neutral",
    },
    {
      key: "cancelled",
      label: "Bookings cancelled in the last 7 days",
      count: cancelledBookings ?? 0,
      href: "/admin/bookings",
      tone: "amber",
    },
    {
      key: "failed_payments",
      label: "Failed payments",
      count: failedPayments ?? 0,
      href: "/admin/finance",
      tone: "red",
    },
  ];

  return items.filter((item) => item.count > 0);
}
