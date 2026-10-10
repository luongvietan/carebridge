import { cookies } from "next/headers";
import { MARKET_COOKIE, type MarketCountry } from "@/lib/marketing/market";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function persistMarketCookie(code: MarketCountry) {
  const store = await cookies();
  store.set(MARKET_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}
