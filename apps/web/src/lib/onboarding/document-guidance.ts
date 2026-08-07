/**
 * What we accept for each document, and the date rule that goes with it.
 *
 * The client asked for acceptable identity and address documents to be stated
 * rather than left to the applicant's judgement — vague guidance is what
 * produces a review queue full of expired driving licences and phone bills.
 * Keyed by `document_types.code`; a type with no entry simply shows no note.
 */

export type DocumentGuidance = {
  /** Shown under the document name on the upload screen. */
  accepted: string;
  /** Proof of address and similar must have been issued recently. */
  maxAgeMonths?: number;
};

export const DOCUMENT_GUIDANCE: Record<string, DocumentGuidance> = {
  photo_id: {
    accepted:
      "Passport (preferred), UK or EEA photocard driving licence, national identity card, or a UK biometric residence permit. The document must be current, and the name must match your application.",
  },
  proof_of_address: {
    accepted:
      "Utility bill (gas, electricity, water or landline — not mobile), bank or building society statement, council tax bill, mortgage statement, or a photocard driving licence showing your current address. It must show your name and address and have been issued within the last 3 months.",
    maxAgeMonths: 3,
  },
  right_to_work: {
    accepted:
      "British or Irish citizens: your passport. Everyone else: generate a Home Office share code at gov.uk/prove-right-to-work and enter it on your profile — we redeem it directly with the Home Office.",
  },
  enhanced_dbs: {
    accepted:
      "Your Enhanced DBS certificate for the workforce you are applying to (adult, child, or both). If you subscribe to the DBS Update Service, upload the certificate and add your subscription under DBS Update Service so we can check its status.",
  },
  professional_registration: {
    accepted:
      "Nurses: your NMC Confirmation of Registration, showing your PIN and expiry. Physiotherapists: your HCPC registration confirmation. We check the number against the public register before approving you.",
  },
  ccps: {
    accepted:
      "A Certificate of Current Professional Status (also called a certificate of good standing) from the regulator you were registered with, where you have practised outside the UK. These are usually valid for 3 months from issue.",
  },
  ofsted_registration: {
    accepted:
      "Your Ofsted registration certificate showing your Unique Reference Number (URN) and the register you are on. We check the URN against the Ofsted register and confirm the registration is active.",
  },
  paediatric_first_aid: {
    accepted:
      "A full paediatric first aid certificate (normally 12 hours) from a recognised training provider, valid for 3 years.",
  },
  professional_indemnity_insurance: {
    accepted:
      "Your current certificate of insurance showing the insured name, level of cover and the period of cover.",
  },
  mandatory_training_certificate: {
    accepted:
      "Certificates covering safeguarding, basic life support, infection prevention and control, health and safety, moving and handling, and GDPR. Upload the most recent certificate covering your mandatory training.",
  },
  professional_reference: {
    accepted:
      "A reference on headed paper or from a work email address, from someone who has supervised your work — not a friend or family member.",
  },
};

export function guidanceFor(code: string | null | undefined): DocumentGuidance | null {
  return (code && DOCUMENT_GUIDANCE[code]) || null;
}
