import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAreaAllowed, roleHome, type AccountType } from "@/lib/auth/rbac";
import { getGateSecret, hasValidGateCookie, isGateEnabled, isGatePathExempt } from "@/lib/auth/gate";

const GUARDED = ["/professional", "/client", "/organisation", "/admin"];

function gateRedirect(request: NextRequest, path: string): NextResponse {
  const gateUrl = new URL("/gate", request.url);
  if (path !== "/") {
    gateUrl.searchParams.set("next", path);
  }
  return NextResponse.redirect(gateUrl);
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isGateEnabled() && !isGatePathExempt(path)) {
    const secret = getGateSecret();
    if (!secret || !hasValidGateCookie(request, secret)) {
      return gateRedirect(request, path);
    }
  }

  if (!GUARDED.some((area) => path === area || path.startsWith(`${area}/`))) {
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
