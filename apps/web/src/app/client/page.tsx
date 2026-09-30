import { getPortalT } from "@/lib/i18n/portal-server";
import { DashboardGrid } from "@/components/dashboard-grid";
import { createClient } from "@/lib/supabase/server";

export default async function ClientHome() {
  const t = await getPortalT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">{t("Dashboard")}</h1>
      {user?.email && (
        <p className="mt-2 text-sm text-[#4a4a4a]">{t("Signed in as")}{" "}{user.email}</p>
      )}

      <DashboardGrid
        cards={[
          {
            href: "/client/messages",
            title: t("Messages"),
            description: t(
              "Message the CareBridge Connect team and read their replies.",
            ),
            cta: t("Open messages"),
          },
          {
            href: "/client/register",
            title: t("Your profile"),
            description: t(
              "Register your care requirements, address and billing details.",
            ),
            cta: t("Manage profile"),
          },
          {
            href: "/client/bookings",
            title: t("Bookings"),
            description: t(
              "Request care sessions and track the status of your bookings.",
            ),
            cta: t("View bookings"),
          },
        ]}
      />
    </main>
  );
}
