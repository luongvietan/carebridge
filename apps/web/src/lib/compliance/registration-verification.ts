import type { RegulatorRegister } from "./regulated-roles";

/**
 * A register check is a statement about the day it was made. The client asked
 * that registration "remains valid", so a check goes stale and has to be
 * repeated: NMC registrants pay an annual retention fee and Ofsted registrations
 * are renewed yearly, which makes twelve months the natural cadence.
 */
export const REGISTRATION_VALIDITY_MONTHS = 12;

export type VerificationOutcome = "active" | "not_found" | "details_mismatch" | "lapsed";

export const VERIFICATION_OUTCOMES: { value: VerificationOutcome; label: string }[] = [
  { value: "active", label: "Registration is active and details match" },
  { value: "details_mismatch", label: "Found, but the details do not match the applicant" },
  { value: "lapsed", label: "Registration has lapsed or is not currently active" },
  { value: "not_found", label: "Not found on the register" },
];

/** ISO date, `REGISTRATION_VALIDITY_MONTHS` after the check. */
export function verificationValidUntil(checkedAt: Date = new Date()): string {
  const due = new Date(
    Date.UTC(checkedAt.getUTCFullYear(), checkedAt.getUTCMonth(), checkedAt.getUTCDate()),
  );
  due.setUTCMonth(due.getUTCMonth() + REGISTRATION_VALIDITY_MONTHS);
  return due.toISOString().slice(0, 10);
}

/** Only an `active` outcome that has not gone stale counts as verified. */
export function isVerificationCurrent(
  verification:
    | { outcome: VerificationOutcome | string | null; valid_until: string | null }
    | null
    | undefined,
  today: string = new Date().toISOString().slice(0, 10),
): boolean {
  if (!verification?.valid_until) return false;
  return verification.outcome === "active" && verification.valid_until >= today;
}

/**
 * NMC PINs are two digits, a letter, four digits and a letter — e.g. 12A3456E.
 * Checking the shape does not prove the registration exists; it catches the
 * transposed characters that would otherwise send an administrator hunting
 * through the register for a PIN that was never valid.
 */
export function isValidNmcPin(value: string): boolean {
  return /^\d{2}[A-Za-z]\d{4}[A-Za-z]$/.test(value.replace(/\s/g, ""));
}

/** Ofsted URNs are 6–8 digits, optionally prefixed (EY, SC, …). */
export function isValidOfstedUrn(value: string): boolean {
  return /^[A-Za-z]{0,3}\d{6,8}$/.test(value.replace(/\s/g, ""));
}

export function normaliseReference(value: string): string {
  return value.replace(/\s/g, "").toUpperCase();
}

/**
 * Whether a reference looks like the register's own format.
 *
 * The UK formats are pinned because they are published and stable. The
 * Portuguese ones are deliberately permissive: a cédula profissional and an ISS
 * authorisation are checked by an administrator against the register itself, and
 * inventing a strict pattern would reject valid numbers — a false rejection here
 * blocks a real professional, which is worse than accepting a typo that the
 * register check will catch anyway.
 */
export function isValidReference(register: RegulatorRegister, value: string): boolean {
  const trimmed = value.replace(/\s/g, "");
  if (register === "nmc") return isValidNmcPin(trimmed);
  if (register === "ofsted") return isValidOfstedUrn(trimmed);
  // HCPC numbers are two letters followed by six digits, e.g. PH123456.
  if (register === "hcpc") return /^[A-Za-z]{2}\d{6}$/.test(trimmed);
  return /^[A-Za-z0-9./-]{4,20}$/.test(trimmed);
}
