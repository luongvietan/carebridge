/**
 * The public identity of the site: where it lives and how people reach it.
 * One place, so a domain move is a one-file change plus the environment.
 *
 * `NEXT_PUBLIC_APP_URL` always wins; the fallback is only what a build with no
 * environment at all should assume, and it is the new home of the platform.
 */
export const DEFAULT_SITE_ORIGIN = "https://carebridgeconnects.com";

export function getSiteOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_SITE_ORIGIN).replace(/\/$/, "");
}

/** The public contact mailbox; set NEXT_PUBLIC_CONTACT_EMAIL when it moves domain. */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@carebridgeconnect.co.uk";
