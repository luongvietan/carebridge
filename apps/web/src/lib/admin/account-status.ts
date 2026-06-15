export type AccountStatus = "active" | "suspended" | "deactivated";

const LEGAL: Record<AccountStatus, AccountStatus[]> = {
  active: ["suspended", "deactivated"],
  suspended: ["active", "deactivated"],
  deactivated: ["active"],
};

export function canSetAccountStatus(
  current: AccountStatus,
  next: AccountStatus,
): { ok: true } | { ok: false; error: string } {
  if (current === next) return { ok: false, error: `Account is already ${current}.` };
  if (!LEGAL[current].includes(next)) return { ok: false, error: `Cannot change account from ${current} to ${next}.` };
  return { ok: true };
}
