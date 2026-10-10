import { createClient } from "@/lib/supabase/server";
import { BookingRequestForm } from "@/components/booking-request-form";
import { BackLink } from "@/components/back-link";
import { fetchBookingReference } from "@/lib/bookings/reference";
import { getAccountCountry } from "@/lib/accounts/market-server";
import { isRegistrationOpen } from "@/lib/marketing/market-server";
import { getPortalT } from "@/lib/i18n/portal-server";

export const dynamic = "force-dynamic";

export default async function ClientNewBookingPage() {
  const [t, supabase, country] = await Promise.all([getPortalT(), createClient(), getAccountCountry()]);
  if (!(await isRegistrationOpen(country))) return <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-10">
    <h1 className="text-3xl font-bold">{country === "PT" ? "Reservas em breve" : "Bookings launching soon"}</h1>
    <p className="mt-4">{country === "PT" ? "Estamos a preparar o lançamento em Portugal." : "New UK bookings are not open yet. Your existing booking history remains available."}</p>
    <BackLink href="/client/bookings" className="mt-6 inline-block underline">{t("Back to bookings")}</BackLink>
  </main>;
  const { roles, careTypes } = await fetchBookingReference(supabase, country);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">{t("New booking")}</h1>
      <p className="mt-2 text-sm text-ink">
        <BackLink href="/client/bookings" className="text-brand-strong hover:underline">
          {t("Back to bookings")}
        </BackLink>
      </p>
      <div className="mt-8">
        <BookingRequestForm roles={roles} careTypes={careTypes} requesterType="client" locale={country === "PT" ? "pt-PT" : "en-GB"} />
      </div>
    </main>
  );
}
