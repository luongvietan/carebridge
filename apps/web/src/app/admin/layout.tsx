import type { ReactNode } from "react";
import { RoleShell } from "@/components/role-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <RoleShell accountType="admin" email={user?.email ?? null}>
      {children}
    </RoleShell>
  );
}
