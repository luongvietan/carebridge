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
  neutral: "border-[#dbe7e0] bg-white",
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
      <p className="text-2xl font-bold text-[#1e5a33]">{value}</p>
      <p className="mt-1 text-sm text-[#4a4a4a]">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-[#7a8a81]">{hint}</p>}
    </div>
  );
}

export default async function AdminHome() {
  const supabase = await createClient();
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
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Dashboard</h1>
      {user?.email && <p className="mt-2 text-sm text-[#4a4a4a]">Signed in as {user.email}</p>}

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Professionals"
          value={metrics.professionals}
          hint={`${metrics.activeProfessionals} active`}
        />
        <Tile
          label="Clients and organisations"
          value={metrics.clients + metrics.organisations}
          hint={`${metrics.clients} private, ${metrics.organisations} organisations`}
        />
        <Tile
          label="Pending approvals"
          value={metrics.documentsAwaitingReview + metrics.applicationsAwaitingApproval}
          hint={`${metrics.documentsAwaitingReview} documents, ${metrics.applicationsAwaitingApproval} applications`}
          tone={
            metrics.documentsAwaitingReview + metrics.applicationsAwaitingApproval > 0
              ? "amber"
              : "neutral"
          }
        />
        <Tile label="Active bookings" value={metrics.activeBookings} />
        <Tile
          label="Expiring compliance documents"
          value={overview.counts.expiring30}
          hint="Within the next 30 days"
          tone={overview.counts.expiring30 > 0 ? "amber" : "neutral"}
        />
        <Tile
          label="Restricted professionals"
          value={metrics.restrictedProfessionals}
          hint="Automatically blocked from bookings"
          tone={metrics.restrictedProfessionals > 0 ? "red" : "neutral"}
        />
        <Tile
          label="Platform revenue this month"
          value={formatGbpMoney(metrics.monthlyRevenue)}
          hint="Margin on bookings paid this month"
        />
        <Tile
          label="Compliance status"
          value={`${overview.counts.green} / ${overview.professionals.length}`}
          hint={`${overview.counts.amber} expiring, ${overview.counts.red} expired`}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Next 30 days</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-[#4a4a4a]">
            No bookings, expiries or payouts scheduled in the next 30 days.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {upcoming.map((day) => (
              <li key={day.date} className="rounded-2xl border border-[#dbe7e0] p-4">
                <p className="text-sm font-semibold text-[#1e5a33]">
                  {new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {day.events.map((event, index) => (
                    <li key={`${event.kind}-${index}`} className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          event.kind === "expiry"
                            ? "bg-[#fcf4d6] text-[#684e1b]"
                            : event.kind === "payout"
                              ? "bg-[#e8f1fb] text-[#0f62fe]"
                              : "bg-[#f5f7f6] text-[#4a4a4a]"
                        }`}
                      >
                        {event.kind === "expiry" ? "expires" : event.kind}
                      </span>
                      <span className="text-[#1e5a33]">{event.title}</span>
                      {event.detail && <span className="text-[#7a8a81]">{event.detail}</span>}
                      <ForwardLink href={event.href} className="text-xs text-[#2e7d32] hover:underline">
                        Open
                      </ForwardLink>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Needs your attention</h2>
        {notifications.length === 0 ? (
          <p className="mt-3 text-sm text-[#4a4a4a]">Nothing is waiting on you right now.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#dbe7e0] rounded-2xl border border-[#dbe7e0] text-sm">
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
                          : "bg-[#f5f7f6] text-[#4a4a4a]"
                    }`}
                  >
                    {item.count}
                  </span>
                  {item.label}
                </span>
                <ForwardLink href={item.href} className="text-[#2e7d32] hover:underline">
                  Open
                </ForwardLink>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DashboardGrid
        cards={[
          {
            href: "/admin/users",
            title: "Users",
            description: "Search and manage professionals, status actions and compliance filters.",
            cta: "Manage users",
          },
          {
            href: "/admin/accounts",
            title: "All accounts",
            description: "Suspend or deactivate any account role across the platform.",
            cta: "Manage accounts",
          },
          {
            href: "/admin/messages",
            title: "Messages",
            description: "Conversations with professionals, clients and organisations.",
            cta: "Open messages",
          },
          {
            href: "/admin/incidents",
            title: "Complaints and incidents",
            description: "Record concerns, track investigations and close them with an outcome.",
            cta: "Open concerns",
          },
          {
            href: "/admin/rates",
            title: "Rate cards",
            description: "View and amend effective-dated rate cards by professional role.",
            cta: "Manage rate cards",
          },
          {
            href: "/admin/finance",
            title: "Finance",
            description: "Review transactions, payments and revenue across bookings.",
            cta: "Open finance",
          },
          {
            href: "/admin/compliance",
            title: "Compliance",
            description: "Review professional documents, expiry alerts and verification status.",
            cta: "Open compliance",
          },
          {
            href: "/admin/bookings",
            title: "Bookings",
            description: "Assign professionals to open bookings and oversee the full booking pipeline.",
            cta: "Manage bookings",
          },
        ]}
      />
    </main>
  );
}
