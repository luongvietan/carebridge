import type { ReactNode } from "react";
import { RoleShell } from "@/components/role-shell";
import { createClient } from "@/lib/supabase/server";

export default async function OrganisationLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <RoleShell role="organisation" email={user?.email ?? null}>
      {children}
    </RoleShell>
  );
}
