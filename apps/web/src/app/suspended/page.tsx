import { getPortalT } from "@/lib/i18n/portal-server";
export default async function SuspendedPage() {
  const t = await getPortalT();
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">{t("Account suspended")}</h1>
      <p className="mt-4 text-sm text-[#4a4a4a]">
        {t("Your CareBridge Connect account is currently suspended or deactivated. If you believe this is a mistake, please contact us.")}
      </p>
    </main>
  );
}
