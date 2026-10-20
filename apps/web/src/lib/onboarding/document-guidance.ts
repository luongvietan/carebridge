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
  // ---- Portugal
  identificacao_direito_trabalho: {
    accepted:
      "Cartão de Cidadão (frente e verso), passaporte ou título de residência válido que lhe permita trabalhar em Portugal. O documento tem de estar em vigor e o nome tem de coincidir com o da candidatura.",
  },
  nif: {
    accepted:
      "Comprovativo do seu NIF: cartão do NIF, Cartão de Cidadão ou certidão emitida pelo Portal das Finanças.",
  },
  niss_comprovativo: {
    accepted:
      "Comprovativo do seu NISS: cartão de Segurança Social ou documento emitido pela Segurança Social Direta.",
  },
  atividade_financas: {
    accepted:
      "Comprovativo de atividade aberta como trabalhador independente, emitido pelo Portal das Finanças (declaração de início de atividade ou certidão de atividade aberta).",
  },
  registo_criminal: {
    accepted:
      "Certificado de registo criminal português emitido pelos serviços de identificação criminal (Justiça), para fins de emprego ou exercício de profissão.",
    maxAgeMonths: 3,
  },
  registo_criminal_menores: {
    accepted:
      "Certificado de registo criminal português emitido para o exercício de funções que envolvam contacto regular com menores (Lei n.º 113/2009). O certificado geral não é suficiente.",
    maxAgeMonths: 3,
  },
  registo_criminal_estrangeiro: {
    accepted:
      "Apenas se aplicável: certificado de registo criminal de cada país onde tenha residido recentemente, com tradução para português quando não estiver em português, inglês ou espanhol.",
  },
  cedula_profissional: {
    accepted:
      "Cédula profissional ou comprovativo de inscrição válida na Ordem dos Enfermeiros ou na Ordem dos Fisioterapeutas, com o número e a validade visíveis.",
  },
  qualificacoes_pt: {
    accepted:
      "Diploma ou certificado das suas habilitações académicas e profissionais (por exemplo, licenciatura, curso profissional ou certificado de formação na sua área).",
  },
  seguro_responsabilidade_civil: {
    accepted:
      "Apólice ou certificado do seu seguro de responsabilidade civil profissional em vigor, com o nome do segurado, o capital e o período de cobertura.",
  },
  seguro_acidentes_trabalho: {
    accepted:
      "Apólice ou certificado do seu seguro de acidentes de trabalho (trabalhador independente) em vigor, com o período de cobertura.",
  },
  referencias_pt: {
    accepted:
      "Uma referência escrita de alguém que tenha supervisionado o seu trabalho (empregador, cliente ou instituição) — não de um amigo ou familiar.",
  },
  historico_profissional: {
    accepted:
      "O seu currículo com o historial profissional: funções, entidades, datas e contactos de referência.",
  },
  primeiros_socorros: {
    accepted:
      "Certificado de primeiros socorros (idealmente com módulo pediátrico) emitido por uma entidade formadora reconhecida, em vigor.",
  },
  autorizacao_iss: {
    accepted:
      "A sua licença/autorização como ama emitida pela Segurança Social (ISS), com o número visível.",
  },
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

const PT_GUIDANCE_EN: Record<string, string> = {
  identificacao_direito_trabalho: "A valid Citizen Card (front and back), passport or residence permit allowing you to work in Portugal. The name must match your application.",
  nif: "Proof of your Portuguese NIF: NIF card, Citizen Card or a certificate issued by Portal das Finanças.",
  niss_comprovativo: "Proof of your NISS: Social Security card or a document from Segurança Social Direta.",
  atividade_financas: "Proof of self-employment registered with Finanças, issued by Portal das Finanças (declaration of commencement or certificate of active registration).",
  registo_criminal: "A Portuguese criminal record certificate issued by the criminal identification services (Justiça), for employment or professional practice.",
  registo_criminal_menores: "A Portuguese criminal record certificate issued for regular contact with minors (Lei n.º 113/2009). A general certificate is insufficient.",
  registo_criminal_estrangeiro: "If applicable: criminal record certificates from countries where you have recently lived, translated into Portuguese when not in Portuguese, English or Spanish.",
  cedula_profissional: "A professional card or proof of valid registration with the Ordem dos Enfermeiros or Ordem dos Fisioterapeutas, with number and validity visible.",
  qualificacoes_pt: "Diplomas or certificates of your academic and professional qualifications, such as a degree, vocational course or training in your field.",
  seguro_responsabilidade_civil: "Current professional liability insurance policy or certificate, showing the insured person's name, cover amount and cover period.",
  seguro_acidentes_trabalho: "Current workplace accident insurance policy or certificate for self-employed professionals, showing the cover period.",
  referencias_pt: "A written reference from someone who supervised your work (employer, client or institution), rather than a friend or relative.",
  historico_profissional: "Your CV showing employment history: roles, organisations, dates and reference contacts.",
  primeiros_socorros: "A valid first aid certificate, ideally including a paediatric module, from a recognised training provider.",
  autorizacao_iss: "Your childminder (Ama) licence/authorisation issued by Social Security (ISS), with its number visible.",
};
export function guidanceFor(code: string | null | undefined, locale?: string): DocumentGuidance | null {
  const guidance = (code && DOCUMENT_GUIDANCE[code]) || null;
  return guidance && code && locale === "en-GB" && PT_GUIDANCE_EN[code] ? { ...guidance, accepted: PT_GUIDANCE_EN[code] } : guidance;
}
