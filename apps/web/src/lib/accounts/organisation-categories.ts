/**
 * The kinds of organisation that book through CareBridge Connect in Portugal,
 * and what each one is registered or licensed by. Ana asked (8 August) for
 * Portuguese categories and registration details rather than a translation of
 * the UK form, whose only regulator field is the CQC number.
 *
 * `licence` says which number the organisation is asked for:
 * - "ers": healthcare providers register with the Entidade Reguladora da Saúde;
 * - "iss": social-care and childcare facilities hold an alvará / licença de
 *   funcionamento from the Instituto da Segurança Social;
 * - null: no licence of its own (a company or other organisation).
 * The number is recorded for the admin team to check; it is not mandatory,
 * because a new organisation may still be waiting for it.
 */

export type LicenceKind = "ers" | "iss";

export type OrganisationCategory = {
  code: string;
  label: string;
  group: string;
  licence: LicenceKind | null;
};

export const PT_ORGANISATION_CATEGORIES: readonly OrganisationCategory[] = [
  { code: "pt_hospital_clinica", label: "Hospital, clínica ou consultório privado", group: "Saúde", licence: "ers" },
  { code: "pt_rncci", label: "Unidade de cuidados continuados (RNCCI)", group: "Saúde", licence: "ers" },
  { code: "pt_erpi", label: "Lar / Estrutura Residencial para Pessoas Idosas (ERPI)", group: "Apoio social", licence: "iss" },
  { code: "pt_sad", label: "Serviço de Apoio Domiciliário (SAD)", group: "Apoio social", licence: "iss" },
  { code: "pt_centro_dia", label: "Centro de dia", group: "Apoio social", licence: "iss" },
  { code: "pt_ipss", label: "IPSS / Santa Casa da Misericórdia", group: "Apoio social", licence: "iss" },
  { code: "pt_creche", label: "Creche / jardim de infância", group: "Infância", licence: "iss" },
  { code: "pt_escola_atl", label: "Escola, ATL ou centro de atividades", group: "Infância", licence: null },
  { code: "pt_empresa", label: "Empresa (outro setor)", group: "Outras", licence: null },
  { code: "pt_outra", label: "Outra organização", group: "Outras", licence: null },
];

export const LICENCE_LABEL: Record<LicenceKind, string> = {
  ers: "Número de registo na ERS",
  iss: "Número do alvará / licença de funcionamento (ISS)",
};

export function organisationCategory(code: string | null | undefined): OrganisationCategory | undefined {
  return PT_ORGANISATION_CATEGORIES.find((c) => c.code === code);
}

/** The category's label, or the raw code when it is unknown (never blank). */
export function organisationCategoryLabel(code: string | null | undefined): string {
  if (!code) return "";
  return organisationCategory(code)?.label ?? code;
}
