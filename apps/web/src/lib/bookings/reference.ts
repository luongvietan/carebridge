import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { MarketCountry } from "@/lib/marketing/market";

export type BookingRole = {
  id: string;
  name: string;
  categoryId: string;
  category: string;
};

export type BookingCareType = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
};

/**
 * Roles (grouped by category) and care types for the booking form. Shared by the
 * client and organisation "new booking" pages so both offer the same options.
 * Only the roles of the market being browsed are offered: a family in Lisbon is
 * not shown London nurses priced in pounds, nor the reverse.
 */
export async function fetchBookingReference(
  supabase: SupabaseClient<Database>,
  country: MarketCountry = "GB",
): Promise<{ roles: BookingRole[]; careTypes: BookingCareType[] }> {
  const [{ data: roles }, { data: careTypes }] = await Promise.all([
    supabase
      .from("professional_roles")
      .select("id, name, category_id, role_categories(name, sort_order)")
      .eq("is_active", true)
      .eq("country_code", country)
      .order("name"),
    supabase
      .from("care_types")
      .select("id, name, description, category_id")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  // Sort by category first so the grouped picker lists Healthcare before Childcare.
  const sortedRoles = [...(roles ?? [])].sort(
    (a, b) =>
      (a.role_categories?.sort_order ?? 0) - (b.role_categories?.sort_order ?? 0) ||
      a.name.localeCompare(b.name),
  );

  return {
    roles: sortedRoles.map((r) => ({
      id: r.id,
      name: r.name,
      categoryId: r.category_id,
      category: r.role_categories?.name ?? "",
    })),
    careTypes: (careTypes ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      categoryId: c.category_id,
    })),
  };
}
