import { createClient } from "@/lib/supabase/server";
import { BookingRequestForm } from "@/components/booking-request-form";
import { BackLink } from "@/components/back-link";
import { fetchBookingReference } from "@/lib/bookings/reference";
import { getSelectedCountry } from "@/lib/marketing/market-server";
import { getPortalT } from "@/lib/i18n/portal-server";

export const dynamic = "force-dynamic";

export default async function ClientNewBookingPage() {
  const [t, supabase, country] = await Promise.all([getPortalT(), createClient(), getSelectedCountry()]);
  const { roles, careTypes } = await fetchBookingReference(supabase, country);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">{t("New booking")}</h1>
      <p className="mt-2 text-sm text-[#4a4a4a]">
        <BackLink href="/client/bookings" className="text-[#2e7d32] hover:underline">
          {t("Back to bookings")}
        </BackLink>
      </p>
      <div className="mt-8">
        <BookingRequestForm roles={roles} careTypes={careTypes} requesterType="client" locale={country === "PT" ? "pt-PT" : "en-GB"} />
      </div>
    </main>
  );
}
