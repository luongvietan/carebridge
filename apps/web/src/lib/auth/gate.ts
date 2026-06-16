import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const GATE_COOKIE_NAME = "cbc_site_access";
const GATE_TOKEN_SALT = "cbc-site-access-v1";

/** Paths that must stay reachable without the gate cookie (webhooks, email links). */
const GATE_EXEMPT = ["/gate", "/api/stripe/webhook", "/auth/confirm"];

export function isGateEnabled(): boolean {
  return process.env.PRODUCTION_GATE_ENABLED === "true";
}

export function getGateSecret(): string | undefined {
  const secret = process.env.PRODUCTION_GATE_SECRET;
  return secret && secret.length > 0 ? secret : undefined;
}

export function isGatePathExempt(path: string): boolean {
  return GATE_EXEMPT.some((exempt) => path === exempt || path.startsWith(`${exempt}/`));
}

export function createGateToken(secret: string): string {
  return createHmac("sha256", secret).update(GATE_TOKEN_SALT).digest("hex");
}

export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function hasValidGateCookie(request: NextRequest, secret: string): boolean {
  const cookie = request.cookies.get(GATE_COOKIE_NAME)?.value;
  if (!cookie) return false;
  return secureCompare(cookie, createGateToken(secret));
}

export function verifyAccessCode(input: string, secret: string): boolean {
  return secureCompare(input, secret);
}
