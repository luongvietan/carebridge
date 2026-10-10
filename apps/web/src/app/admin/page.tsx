import { getPortalT } from "@/lib/i18n/portal-server";
import { Tr } from "@/components/portal-locale";
import { DashboardGrid } from "@/components/dashboard-grid";
import { ForwardLink } from "@/components/forward-link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { loadDashboardMetrics, loadNotificationItems } from "@/lib/admin/dashboard-metrics";
import { loadComplianceOverview } from "@/lib/compliance/overview";
import { loadUpcoming } from "@/lib/admin/upcoming";
import { formatGbpMoney } from "@/lib/format/money";

export const dynamic = "force-dynamic";

const TONE = {
  neutral: "border-line bg-white",
  amber: "border-[#f0dfa0] bg-[#fefbf0]",
  red: "border-[#f5b8bb] bg-[#fff5f5]",
} as const;

function Tile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: keyof typeof TONE;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${TONE[tone]}`}>
      <p className="text-2xl font-bold text-brand-ink">{value}</p>
      <p className="mt-1 text-sm text-ink">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default async function AdminHome() {
  const [t, supabase] = await Promise.all([getPortalT(), createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createServiceClient();
  const [metrics, overview, upcoming] = await Promise.all([
    loadDashboardMetrics(admin),
    loadComplianceOverview(admin),
    loadUpcoming(admin),
  ]);
  const notifications = await loadNotificationItems(admin, overview.counts.expiring30);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold"><Tr>{"Dashboard"}</Tr></h1>
      <ForwardLink href="/admin/readiness"><Tr>{"Portugal launch readiness"}</Tr></ForwardLink>
      {user?.email && <p className="mt-2 text-sm text-ink"><Tr>{"Signed in as"}</Tr>{" "}{user.email}</p>}

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label={t("Professionals")}
          value={metrics.professionals}
          hint={t("{n} active", { n: metrics.activeProfessionals })}
        />
        <Tile
          label={t("Clients and organisations")}
          value={metrics.clients + metrics.organisations}
          hint={t("{clients} private, {organisations} organisations", { clients: metrics.clients, organisations: metrics.organisations })}
        />
        <Tile
          label={t("Pending approvals")}
          value={metrics.documentsAwaitingReview + metrics.applicationsAwaitingApproval}
          hint={t("{documents} documents, {applications} applications", { documents: metrics.documentsAwaitingReview, applications: metrics.applicationsAwaitingApproval })}
          tone={metrics.documentsAwaitingReview + metrics.applicationsAwaitingApproval > 0
              ? "amber"
              : "neutral"}
        />
        <Tile label={t("Active bookings")} value={metrics.activeBookings} />
        <Tile
          label={t("Expiring compliance documents")}
          value={overview.counts.expiring30}
          hint={t("Within the next 30 days")}
          tone={overview.counts.expiring30 > 0 ? "amber" : "neutral"}
        />
        <Tile
          label={t("Restricted professionals")}
          value={metrics.restrictedProfessionals}
          hint={t("Automatically blocked from bookings")}
          tone={metrics.restrictedProfessionals > 0 ? "red" : "neutral"}
        />
        <Tile
          label={t("Platform revenue this month")}
          value={formatGbpMoney(metrics.monthlyRevenue)}
          hint={t("Margin on bookings paid this month")}
        />
        <Tile
          label={t("Compliance status")}
          value={`${overview.counts.green} / ${overview.professionals.length}`}
          hint={t("{expiring} expiring, {expired} expired", { expiring: overview.counts.amber, expired: overview.counts.red })}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold"><Tr>{"Next 30 days"}</Tr></h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-ink"><Tr>{"No bookings, expiries or payouts scheduled in the next 30 days."}</Tr></p>
        ) : (
          <ol className="mt-4 space-y-3">
            {upcoming.map((day) => (
              <li key={day.date} className="rounded-2xl border border-line p-4">
                <p className="text-sm font-semibold text-brand-ink">
                  {new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {day.events.map((event) => (
                    <li key={`${event.date}-${event.kind}-${event.title}-${event.href}`} className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          event.kind === "expiry"
                            ? "bg-[#fcf4d6] text-[#684e1b]"
                            : event.kind === "payout"
                              ? "bg-[#e8f1fb] text-[#0f62fe]"
                              : "bg-surface text-ink"
                        }`}
                      >
                        {event.kind === "expiry" ? "expires" : event.kind}
                      </span>
                      <span className="text-brand-ink">{event.title}</span>
                      {event.detail && <span className="text-muted">{event.detail}</span>}
                      <ForwardLink href={event.href} className="text-xs text-brand-strong hover:underline"><Tr>{"Open"}</Tr></ForwardLink>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold"><Tr>{"Needs your attention"}</Tr></h2>
        {notifications.length === 0 ? (
          <p className="mt-3 text-sm text-ink"><Tr>{"Nothing is waiting on you right now."}</Tr></p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line text-sm">
            {notifications.map((item) => (
              <li key={item.key} className="flex items-center justify-between gap-4 p-3">
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                      item.tone === "red"
                        ? "bg-[#fff1f1] text-[#a2191f]"
                        : item.tone === "amber"
                          ? "bg-[#fcf4d6] text-[#684e1b]"
                          : "bg-surface text-ink"
                    }`}
                  >
                    {item.count}
                  </span>
                  {item.label}
                </span>
                <ForwardLink href={item.href} className="text-brand-strong hover:underline"><Tr>{"Open"}</Tr></ForwardLink>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DashboardGrid
        cards={[
          {
            href: "/admin/users",
            title: t("Users"),
            description: t("Search and manage professionals, status actions and compliance filters."),
            cta: t("Manage users"),
          },
          {
            href: "/admin/accounts",
            title: t("All accounts"),
            description: t("Suspend or deactivate any account role across the platform."),
            cta: t("Manage accounts"),
          },
          {
            href: "/admin/messages",
            title: t("Messages"),
            description: t("Conversations with professionals, clients and organisations."),
            cta: t("Open messages"),
          },
          {
            href: "/admin/incidents",
            title: t("Complaints and incidents"),
            description: t("Record concerns, track investigations and close them with an outcome."),
            cta: t("Open concerns"),
          },
          {
            href: "/admin/rates",
            title: t("Rate cards"),
            description: t("View and amend effective-dated rate cards by professional role."),
            cta: t("Manage rate cards"),
          },
          {
            href: "/admin/finance",
            title: t("Finance"),
            description: t("Review transactions, payments and revenue across bookings."),
            cta: t("Open finance"),
          },
          {
            href: "/admin/compliance",
            title: t("Compliance"),
            description: t("Review professional documents, expiry alerts and verification status."),
            cta: t("Open compliance"),
          },
          {
            href: "/admin/bookings",
            title: t("Bookings"),
            description: t("Assign professionals to open bookings and oversee the full booking pipeline."),
            cta: t("Manage bookings"),
          },
        ]}
      />
    </main>
  );
}
