import { roleHome, type AccountType } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { SiteNavClient } from "@/components/site-nav-client";

export { BrandMark } from "@/components/site-nav-client";

export async function SiteNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dashboardHref: string | null = null;
  if (user) {
    const { data: row } = await supabase
      .from("users")
      .select("account_type")
      .eq("id", user.id)
      .single();
    if (row?.account_type) {
      dashboardHref = roleHome(row.account_type as AccountType);
    }
  }

  return <SiteNavClient dashboardHref={dashboardHref} />;
}
