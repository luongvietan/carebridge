import type { ReactNode } from "react";
import { RoleNav } from "@/components/role-nav";
import type { AccountType } from "@/lib/auth/rbac";
import { ROLE_LABEL, ROLE_NAV } from "@/lib/auth/role-nav";

type RoleShellProps = {
  accountType: AccountType;
  email: string | null;
  children: ReactNode;
};

export function RoleShell({ accountType, email, children }: RoleShellProps) {
  return (
    <div className="min-h-screen bg-white">
      <RoleNav areaLabel={ROLE_LABEL[accountType]} items={ROLE_NAV[accountType]} email={email} />
      {children}
    </div>
  );
}
