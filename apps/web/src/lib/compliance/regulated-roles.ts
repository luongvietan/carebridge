/**
 * Which register a role answers to, and what it needs from the professional.
 *
 * Portugal Phase 1 turned this from a list of role codes into a reading of data:
 * `professional_roles.registration_register` says which register applies, and
 * everything here derives from that value. Adding a regulated role in a new
 * country is now a row, not an edit to this file — which is what the client
 * meant by "configurable separately rather than hard-coded".
 */

export const REGULATOR_REGISTERS = [
  "nmc",
  "ofsted",
  "hcpc",
  "ordem_enfermeiros",
  "ordem_fisioterapeutas",
  "iss",
] as const;

export type RegulatorRegister = (typeof REGULATOR_REGISTERS)[number];

export function isRegulatorRegister(value: string | null | undefined): value is RegulatorRegister {
  return !!value && (REGULATOR_REGISTERS as readonly string[]).includes(value);
}

/** The register a role answers to, or null where the documents alone govern it. */
export function registerForRole(
  role: { registration_register?: string | null } | string | null | undefined,
): RegulatorRegister | null {
  const value = typeof role === "string" ? role : role?.registration_register;
  return isRegulatorRegister(value) ? value : null;
}

export const REGISTER_LABEL: Record<RegulatorRegister, string> = {
  nmc: "NMC register",
  ofsted: "Ofsted register",
  hcpc: "HCPC register",
  ordem_enfermeiros: "Ordem dos Enfermeiros",
  ordem_fisioterapeutas: "Ordem dos Fisioterapeutas",
  iss: "ISS (Segurança Social)",
};

/** Where an administrator goes to check it. */
export const REGISTER_LOOKUP_URL: Record<RegulatorRegister, string> = {
  nmc: "https://www.nmc.org.uk/registration/search-the-register/",
  ofsted: "https://www.gov.uk/find-registered-childcare-provider",
  hcpc: "https://www.hcpc-uk.org/check-the-register/",
  ordem_enfermeiros: "https://www.ordemenfermeiros.pt/",
  ordem_fisioterapeutas: "https://www.ordemdosfisioterapeutas.pt/",
  iss: "https://www.seg-social.pt/",
};

/**
 * The three kinds of reference a register asks for. They are stored in
 * different columns because they are different things: membership of a
 * professional body, a childcare registration, and an authorisation to carry out
 * a regulated activity.
 */
export type RegisterReference = "registration_number" | "ofsted_urn" | "iss_authorisation";

export function referenceFieldFor(register: RegulatorRegister): RegisterReference {
  if (register === "ofsted") return "ofsted_urn";
  if (register === "iss") return "iss_authorisation";
  return "registration_number";
}

export const REFERENCE_LABEL: Record<RegulatorRegister, string> = {
  nmc: "NMC PIN",
  hcpc: "HCPC registration number",
  ofsted: "Ofsted Unique Reference Number (URN)",
  ordem_enfermeiros: "Cédula profissional",
  ordem_fisioterapeutas: "Cédula profissional",
  iss: "ISS authorisation number",
};

export const REFERENCE_PLACEHOLDER: Record<RegulatorRegister, string> = {
  nmc: "e.g. 12A3456E",
  hcpc: "e.g. PH123456",
  ofsted: "e.g. EY123456",
  ordem_enfermeiros: "e.g. 12345",
  ordem_fisioterapeutas: "e.g. 12345",
  iss: "As shown on the ISS authorisation",
};

/** Does this role need an Ofsted URN captured on the profile? */
export function requiresOfstedRegistration(
  role: { registration_register?: string | null } | string | null | undefined,
): boolean {
  return registerForRole(role) === "ofsted";
}

/** Does this role need an ISS authorisation number captured on the profile? */
export function requiresIssAuthorisation(
  role: { registration_register?: string | null } | string | null | undefined,
): boolean {
  return registerForRole(role) === "iss";
}
