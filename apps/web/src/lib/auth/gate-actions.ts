"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createGateToken,
  GATE_COOKIE_NAME,
  getGateSecret,
  isGateEnabled,
  verifyAccessCode,
} from "@/lib/auth/gate";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

export type GateAccessResult = { error: string } | null;

export async function submitGateAccess(
  _prev: GateAccessResult,
  formData: FormData,
): Promise<GateAccessResult> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  if (!isGateEnabled()) {
    redirect("/");
  }

  const secret = getGateSecret();
  if (!secret) {
    return { error: "Access gate is enabled but not configured. Contact the site administrator." };
  }

  const input = String(formData.get("accessCode") ?? "");
  if (!verifyAccessCode(input, secret)) {
    return { error: "Invalid access code." };
  }

  const cookieStore = await cookies();
  cookieStore.set(GATE_COOKIE_NAME, createGateToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  redirect(safeRedirectPath(formData.get("next")?.toString()));
}
