import { createClient } from "@/lib/supabase/server";

/** Returns the caller's user id if they are an admin/founder, else null. */
export async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: row } = await supabase
    .from("users")
    .select("account_type, is_founder")
    .eq("id", user.id)
    .maybeSingle();
  return row && (row.account_type === "admin" || row.is_founder) ? user.id : null;
}
