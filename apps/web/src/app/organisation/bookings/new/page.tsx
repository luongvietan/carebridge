import { createClient } from "@/lib/supabase/server";
import { BookingRequestForm } from "@/components/booking-request-form";
import { BackLink } from "@/components/back-link";

export const dynamic = "force-dynamic";

export default async function OrganisationNewBookingPage() {
  const supabase = await createClient();
  const { data: roles } = await supabase
    .from("professional_roles")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">New booking</h1>
      <p className="mt-2 text-sm text-[#5b6a62]">
        <BackLink href="/organisation/bookings" className="text-[#198038] hover:underline">
          Back to bookings
        </BackLink>
      </p>
      <div className="mt-8">
        <BookingRequestForm roles={roles ?? []} requesterType="organisation" />
      </div>
    </main>
  );
}
