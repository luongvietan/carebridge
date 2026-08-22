/**
 * Failed sign-in rules — pure, so the throttling decision and the header
 * parsing behind the audit entries are testable without a database or a request.
 *
 * The failed attempts themselves are observed first-hand by the sign-in server
 * action: it performs the authentication, so a log entry is written as a
 * consequence of a real attempt rather than by an endpoint anyone can post to.
 */

/** Audit action recorded for an attempt that did not end in a session. */
export const FAILED_SIGN_IN_ACTION = "auth.sign_in_failed";

/**
 * Recording window for the throttle. A flood of wrong passwords must not fill
 * the audit log, so only the first attempts per address in each window are
 * recorded; the attempt itself is still rejected every time.
 */
export const FAILURE_RECORDING_WINDOW_MINUTES = 15;

/** How many failures are recorded per address before further ones are skipped. */
export const MAX_RECORDED_FAILURES_PER_WINDOW = 10;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function shouldRecordFailure(recordedInRange: number): boolean {
  return recordedInRange < MAX_RECORDED_FAILURES_PER_WINDOW;
}

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-f]+(:[0-9a-f]*)+$|^[0-9a-f:]*::[0-9a-f:.]*$/i;

/**
 * The client address from proxy headers, as far as one can be trusted at all.
 * x-forwarded-for may chain several proxies — the first entry is the original
 * caller — and anything that is not plausibly an address is dropped rather
 * than stored, because audit_log.ip_address is an inet column and would reject
 * the whole insert.
 */
export function parseClientIp(headerValue: string | null | undefined): string | null {
  if (!headerValue) return null;
  const candidate = headerValue.split(",")[0]?.trim();
  if (!candidate || candidate.length > 45) return null;
  if (IPV4.test(candidate)) {
    return candidate.split(".").every((octet) => Number(octet) <= 255) ? candidate : null;
  }
  return IPV6.test(candidate) ? candidate : null;
}

/** User agents are attacker-controlled free text; cap them before storing. */
export function truncateUserAgent(userAgent: string | null | undefined): string | null {
  const ua = userAgent?.trim();
  if (!ua) return null;
  return ua.slice(0, 300);
}

/**
 * A short human reason for the audit summary, from the provider's error code.
 * The message shown to the user stays generic whatever this says.
 */
export function describeAuthError(code: string | null | undefined): string {
  switch (code) {
    case "email_not_confirmed":
      return "Email not confirmed";
    case "over_request_rate_limit":
      return "Provider rate limit reached";
    case "user_banned":
      return "Account banned";
    default:
      return "Invalid credentials";
  }
}
