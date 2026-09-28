import { createClient } from "@/lib/supabase/server";
import { BookingRequestForm } from "@/components/booking-request-form";
import { BackLink } from "@/components/back-link";
import { fetchBookingReference } from "@/lib/bookings/reference";
import { getSelectedCountry } from "@/lib/marketing/market-server";

export const dynamic = "force-dynamic";

export default async function OrganisationNewBookingPage() {
  const supabase = await createClient();
  const country = await getSelectedCountry();
  const { roles, careTypes } = await fetchBookingReference(supabase, country);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">New booking</h1>
      <p className="mt-2 text-sm text-[#4a4a4a]">
        <BackLink href="/organisation/bookings" className="text-[#2e7d32] hover:underline">
          Back to bookings
        </BackLink>
      </p>
      <div className="mt-8">
        <BookingRequestForm roles={roles} careTypes={careTypes} requesterType="organisation" locale={country === "PT" ? "pt-PT" : "en-GB"} />
      </div>
    </main>
  );
}
