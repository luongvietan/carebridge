import { createClient } from "@/lib/supabase/server";
import { BookingRequestForm } from "@/components/booking-request-form";
import { BackLink } from "@/components/back-link";
import { fetchBookingReference } from "@/lib/bookings/reference";
import { getAccountCountry } from "@/lib/accounts/market-server";
import { isRegistrationOpen } from "@/lib/marketing/market-server";
import { getPortalT, getPortalLocale } from "@/lib/i18n/portal-server";

export const dynamic = "force-dynamic";

export default async function OrganisationNewBookingPage() {
  const [t, supabase, country, locale] = await Promise.all([getPortalT(), createClient(), getAccountCountry(), getPortalLocale()]);
  if (!(await isRegistrationOpen(country))) return <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-10">
    <h1 className="text-3xl font-bold">{locale === "pt-PT" ? "Reservas em breve" : "Bookings launching soon"}</h1>
    <p className="mt-4">{locale === "pt-PT" ? "As marcações ainda não estão abertas para este mercado." : "Bookings are not open for this market yet. Your existing booking history remains available."}</p>
    <BackLink href="/organisation/bookings" className="mt-6 inline-block underline">{t("Back to bookings")}</BackLink>
  </main>;
  const { roles, careTypes } = await fetchBookingReference(supabase, country);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">{t("New booking")}</h1>
      <p className="mt-2 text-sm text-ink">
        <BackLink href="/organisation/bookings" className="text-brand-strong hover:underline">
          {t("Back to bookings")}
        </BackLink>
      </p>
      <div className="mt-8">
        <BookingRequestForm roles={roles} careTypes={careTypes} country={country} requesterType="organisation" locale={locale} />
      </div>
    </main>
  );
}
