import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/auth/require-auth";
import { LOCALE_COOKIE, resolveLocale } from "./preference";
export const getPreferredLocale = cache(async () => {
  const [store, user] = await Promise.all([cookies(), getAuthUser()]);
  return resolveLocale(store.get(LOCALE_COOKIE)?.value, user?.user_metadata?.preferred_locale);
});
