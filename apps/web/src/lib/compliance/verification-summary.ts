import { registerForRole, REGISTER_LABEL } from "./regulated-roles";

/**
 * The six checks behind the "Fully Verified" badge (client request, 7 Aug).
 *
 * These are derived from what has already been verified — approved documents and
 * the recorded register check — rather than stored as a separate flag. A badge
 * that can drift from the underlying evidence is worse than no badge: it would
 * keep saying "verified" after a DBS lapsed.
 */

export type CheckState = "verified" | "outstanding" | "not_applicable";

export type VerificationCheck = {
  key: string;
  label: string;
  state: CheckState;
  /** Shown under the label when the check is not a plain pass. */
  detail?: string;
};

export type VerificationSummary = {
  checks: VerificationCheck[];
  /** True when every applicable check passes — what the badge asserts. */
  fullyVerified: boolean;
};

/** Documents that evidence each check, in priority order. */
const DOCUMENT_CHECKS: { key: string; label: string; codes: string[] }[] = [
  { key: "identity", label: "Identity verified", codes: ["photo_id"] },
  { key: "right_to_work", label: "Right to Work verified", codes: ["right_to_work"] },
  {
    key: "criminal_record",
    label: "DBS / criminal record verified",
    codes: ["enhanced_dbs"],
  },
  { key: "references", label: "References checked", codes: ["professional_reference"] },
  {
    key: "training",
    label: "Mandatory training up to date",
    codes: ["mandatory_training_certificate"],
  },
];

export function summariseVerification(args: {
  roleCode: string | null | undefined;
  /** Codes of documents that are approved and in date. */
  approvedDocumentCodes: string[];
  /** Codes the professional's role actually requires. */
  requiredDocumentCodes: string[];
  /** Whether a current, active register check is on file. */
  registrationVerified: boolean;
}): VerificationSummary {
  const approved = new Set(args.approvedDocumentCodes);
  const required = new Set(args.requiredDocumentCodes);

  const checks: VerificationCheck[] = DOCUMENT_CHECKS.map(({ key, label, codes }) => {
    const applicable = codes.some((code) => required.has(code));
    if (!applicable) {
      return { key, label, state: "not_applicable", detail: "Not required for this role" };
    }
    const satisfied = codes.some((code) => approved.has(code));
    return { key, label, state: satisfied ? "verified" : "outstanding" };
  });

  // Professional registration is the one check that is not a document: it is the
  // administrator's own check against the regulator's register.
  const register = registerForRole(args.roleCode);
  checks.splice(1, 0, {
    key: "registration",
    label: "Professional registration verified",
    state: !register ? "not_applicable" : args.registrationVerified ? "verified" : "outstanding",
    detail: register
      ? `Checked against the ${REGISTER_LABEL[register]}`
      : "This role is not separately regulated",
  });

  return {
    checks,
    fullyVerified: checks.every((c) => c.state !== "outstanding"),
  };
}
