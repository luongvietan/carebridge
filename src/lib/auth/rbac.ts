export type AccountType = "professional" | "private_client" | "organisation" | "admin";

const AREA: Record<AccountType, string> = {
  professional: "/professional",
  private_client: "/client",
  organisation: "/organisation",
  admin: "/admin",
};

export function roleHome(role: AccountType): string {
  return AREA[role];
}

/**
 * Is `pathname` inside an area this role may access?
 * Founder bypasses all checks. Non-role paths (public) are always allowed.
 */
export function isAreaAllowed(role: AccountType, pathname: string, isFounder: boolean): boolean {
  if (isFounder) return true;
  const owned = AREA[role];
  const guarded = Object.values(AREA);
  const area = guarded.find((a) => pathname === a || pathname.startsWith(a + "/"));
  return area ? area === owned : true;
}
