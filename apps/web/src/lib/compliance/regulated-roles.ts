/**
 * Which roles answer to which regulator.
 *
 * The rule lives here rather than as a role-code comparison scattered through
 * the profile form, the server action and the admin screens — 0067 adding
 * childminders alongside nannies is exactly the change that leaves one of those
 * copies behind.
 */

/** Roles that must hold an Ofsted registration (URN) to be listed. */
export const OFSTED_ROLE_CODES = ["nanny", "childminder"] as const;

/** Roles registered with the Nursing and Midwifery Council. */
export const NMC_ROLE_CODES = ["adult_nurse", "paediatric_nurse", "mental_health_nurse"] as const;

/** Roles registered with the Health and Care Professions Council. */
export const HCPC_ROLE_CODES = ["physiotherapist"] as const;

export type RegulatorRegister = "ofsted" | "nmc" | "hcpc";

export function requiresOfstedRegistration(roleCode: string | null | undefined): boolean {
  return (OFSTED_ROLE_CODES as readonly string[]).includes(roleCode ?? "");
}

export function requiresNmcRegistration(roleCode: string | null | undefined): boolean {
  return (NMC_ROLE_CODES as readonly string[]).includes(roleCode ?? "");
}

export function requiresHcpcRegistration(roleCode: string | null | undefined): boolean {
  return (HCPC_ROLE_CODES as readonly string[]).includes(roleCode ?? "");
}

/**
 * The register a role must be checked against, or null where the role is not
 * separately regulated (healthcare assistants, support workers, babysitters,
 * mother's helpers) and the document set alone governs approval.
 */
export function registerForRole(roleCode: string | null | undefined): RegulatorRegister | null {
  if (requiresOfstedRegistration(roleCode)) return "ofsted";
  if (requiresNmcRegistration(roleCode)) return "nmc";
  if (requiresHcpcRegistration(roleCode)) return "hcpc";
  return null;
}

/** Public register an administrator checks a registration against. */
export const REGISTER_LOOKUP_URL: Record<RegulatorRegister, string> = {
  ofsted: "https://www.gov.uk/find-registered-childcare-provider",
  nmc: "https://www.nmc.org.uk/registration/search-the-register/",
  hcpc: "https://www.hcpc-uk.org/check-the-register/",
};

export const REGISTER_LABEL: Record<RegulatorRegister, string> = {
  ofsted: "Ofsted register",
  nmc: "NMC register",
  hcpc: "HCPC register",
};
