import type { ReactNode } from "react";
import { RoleNav } from "@/components/role-nav";
import type { AccountType } from "@/lib/auth/rbac";
import { ROLE_LABEL, ROLE_NAV } from "@/lib/auth/role-nav";

type RoleShellProps = {
  role: AccountType;
  email: string | null;
  children: ReactNode;
};

export function RoleShell({ role, email, children }: RoleShellProps) {
  return (
    <div className="min-h-screen bg-white">
      <RoleNav areaLabel={ROLE_LABEL[role]} items={ROLE_NAV[role]} email={email} />
      {children}
    </div>
  );
}
