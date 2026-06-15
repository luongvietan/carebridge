import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAreaAllowed, roleHome, type AccountType } from "@/lib/auth/rbac";

const GUARDED = ["/professional", "/client", "/organisation", "/admin"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!GUARDED.some((a) => path === a || path.startsWith(a + "/"))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: row } = await supabase
    .from("users")
    .select("account_type, is_founder, account_status")
    .eq("id", user.id)
    .single();
  if (!row) return NextResponse.redirect(new URL("/login", request.url));
  if (row.account_status !== "active") return NextResponse.redirect(new URL("/suspended", request.url));

  const role = row.account_type as AccountType;
  if (!isAreaAllowed(role, path, row.is_founder)) {
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }
  return response;
}

export const config = {
  matcher: [
    "/professional",
    "/professional/:path*",
    "/client",
    "/client/:path*",
    "/organisation",
    "/organisation/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
