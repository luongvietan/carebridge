import type { ReactNode } from "react";
import { RoleShell } from "@/components/role-shell";
import { createClient } from "@/lib/supabase/server";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <RoleShell accountType="private_client" email={user?.email ?? null}>
      {children}
    </RoleShell>
  );
}
