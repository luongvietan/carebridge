import { getPreferredLocale } from "./preference-server";
import { legalLangFromParam, type LegalLang } from "@/data/legal-copy-pt";

export async function preferredLegalLang(searchParams: Promise<Record<string, string | string[] | undefined>>): Promise<LegalLang> {
  const param = (await searchParams).lang;
  return param === "pt" || param === "en" ? legalLangFromParam(param) : (await getPreferredLocale()) === "en-GB" ? "en" : "pt";
}
