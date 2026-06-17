import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_OTP_TYPES = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const satisfies readonly EmailOtpType[];

function isAllowedOtpType(value: string): value is EmailOtpType {
  return (ALLOWED_OTP_TYPES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");

  if (!token_hash || !typeParam || !isAllowedOtpType(typeParam)) {
    return NextResponse.redirect(new URL("/login?error=verify", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type: typeParam, token_hash });
  if (!error) {
    return NextResponse.redirect(
      new URL(safeRedirectPath(searchParams.get("next"), "/login"), request.url),
    );
  }
  return NextResponse.redirect(new URL("/login?error=verify", request.url));
}
