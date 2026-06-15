import type { AccountType } from "@/lib/auth/rbac";

export type RoleNavItem = { href: string; label: string };

export const ROLE_LABEL: Record<AccountType, string> = {
  professional: "Professional",
  private_client: "Private client",
  organisation: "Organisation",
  admin: "Admin",
};

export const ROLE_NAV: Record<AccountType, RoleNavItem[]> = {
  professional: [
    { href: "/professional", label: "Dashboard" },
    { href: "/professional/onboarding/eligibility", label: "Onboarding" },
    { href: "/professional/bookings", label: "Bookings" },
  ],
  private_client: [
    { href: "/client", label: "Dashboard" },
    { href: "/client/register", label: "Your profile" },
    { href: "/client/bookings", label: "Bookings" },
  ],
  organisation: [
    { href: "/organisation", label: "Dashboard" },
    { href: "/organisation/register", label: "Your profile" },
    { href: "/organisation/bookings", label: "Bookings" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/compliance", label: "Compliance" },
    { href: "/admin/bookings", label: "Bookings" },
  ],
};
