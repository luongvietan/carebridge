import { PortalBookingsPage } from "@/components/portal-bookings-page";
export const dynamic = "force-dynamic";
export default function ClientBookingsPage() {
  return <PortalBookingsPage newBookingHref="/client/bookings/new" />;
}
