import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { RoleShell } from "@/components/role-shell";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Defence-in-depth: every /admin route is authorised here at the data layer,
  // not only by the proxy. Admin pages query via the RLS-bypassing service
  // client, so this server-side check must not be the proxy's responsibility
  // alone (the proxy is an optimistic check per Next.js guidance).
  if (!(await requireAdmin())) redirect("/login");

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
