import type { RegulatorRegister } from "@/lib/compliance/regulated-roles";
import { REGISTER_LABEL, REFERENCE_LABEL } from "@/lib/compliance/regulated-roles";

/**
 * What a single role of a professional's is still waiting for.
 *
 * The database decides eligibility (fn_role_assignment_eligible); this is the
 * same question asked in a way that can be shown to the person, so "not yet
 * active" comes with the reason rather than leaving them to guess.
 */
export type RoleGaps = {
  /** Names of the critical document types this role requires and does not have. */
  missingDocuments: string[];
  assessmentPassed: boolean;
  /** False when the role answers to a register and no current check is recorded. */
  registrationVerified: boolean;
  /** True when the role needs a registration number and none is on file. */
  missingRegistrationReference: boolean;
  /** The register this role answers to, or null where documents alone govern it. */
  register: RegulatorRegister | null;
};

export function roleIsReady(gaps: RoleGaps): boolean {
  return (
    gaps.missingDocuments.length === 0 &&
    gaps.assessmentPassed &&
    gaps.registrationVerified &&
    !gaps.missingRegistrationReference
  );
}

/**
 * The outstanding items, in the order the professional can act on them: what
 * they supply themselves first, then what waits on an administrator.
 */
export function roleOutstanding(gaps: RoleGaps): string[] {
  const items: string[] = [];

  if (gaps.missingRegistrationReference && gaps.register) {
    items.push(`Add your ${REFERENCE_LABEL[gaps.register]}`);
  }
  if (!gaps.assessmentPassed) {
    items.push("Pass the assessment for this role");
  }
  for (const name of gaps.missingDocuments) {
    items.push(`Upload and have approved: ${name}`);
  }
  // Last: it is the one item nobody but an administrator can clear.
  if (!gaps.registrationVerified && gaps.register && !gaps.missingRegistrationReference) {
    items.push(`Awaiting our check of the ${REGISTER_LABEL[gaps.register]}`);
  }

  return items;
}

export type RoleAssignmentStatus = "pending" | "active" | "restricted" | "withdrawn";

export const ROLE_STATUS_LABEL: Record<RoleAssignmentStatus, string> = {
  pending: "In progress",
  active: "Active",
  restricted: "Restricted",
  withdrawn: "Withdrawn",
};

export const ROLE_STATUS_TONE: Record<RoleAssignmentStatus, string> = {
  pending: "bg-[#fff4e5] text-[#8a5a00]",
  active: "bg-[#e8f5e9] text-[#1e5a33]",
  restricted: "bg-[#fdecea] text-[#a4262c]",
  withdrawn: "bg-[#f2f4f3] text-[#6b7280]",
};
