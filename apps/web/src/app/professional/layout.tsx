import type { ReactNode } from "react";
import { RoleShell } from "@/components/role-shell";
import { createClient } from "@/lib/supabase/server";

export default async function ProfessionalLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <RoleShell role="professional" email={user?.email ?? null}>
      {children}
    </RoleShell>
  );
}
