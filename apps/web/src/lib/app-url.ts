/** Public site origin — used for auth redirects, Stripe return URLs, etc. */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000";
  return raw.replace(/\/$/, "");
}
