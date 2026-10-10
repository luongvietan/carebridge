import { PortalBookingsPage } from "@/components/portal-bookings-page";
export const dynamic = "force-dynamic";
export default function OrganisationBookingsPage() {
  return <PortalBookingsPage newBookingHref="/organisation/bookings/new" />;
}
