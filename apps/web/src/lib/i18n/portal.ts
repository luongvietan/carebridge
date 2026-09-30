/**
 * The signed-in app's words. English is written in the code itself, so the code
 * reads as it always did; `t("Bookings")` returns the Portuguese for a
 * Portuguese-market user and the same English string otherwise. The Portuguese
 * lives in `portal-pt.ts`, and a test fails if a string used in the app has no
 * Portuguese entry, so a new label cannot silently ship untranslated.
 */
import { PORTAL_PT } from "@/lib/i18n/portal-pt";

export type PortalLocale = "en-GB" | "pt-PT";
export type T = (text: string, vars?: Record<string, string | number>) => string;

/**
 * Messages that carry a value (a register name, a role) cannot be keyed whole.
 * Each pattern maps the English shape to a Portuguese one, keeping the value.
 */
const PATTERNS: [RegExp, (m: RegExpExecArray) => string][] = [
  [/^Add your (.+)$/, (m) => `Indique: ${m[1]}`],
  [/^Awaiting our check of the (.+)$/, (m) => `A aguardar a nossa verificação junto de ${m[1]}`],
  [/^Upload and have approved: (.+)$/, (m) => `Envie e obtenha aprovação: ${m[1]}`],
  [
    /^Please check these fields: (.+)\.$/,
    (m) => `Verifique estes campos: ${m[1].split(", ").map((f) => PORTAL_PT[f] ?? f).join(", ")}.`,
  ],
  [/^Enter your (.+)\.$/, (m) => `Indique: ${m[1]}.`],
  [/^That does not look like a valid (.+)\.$/, (m) => `Não parece um(a) ${m[1]} válido(a).`],
];

function translatePt(text: string): string {
  const exact = PORTAL_PT[text];
  if (exact !== undefined) return exact;
  for (const [re, fn] of PATTERNS) {
    const m = re.exec(text);
    if (m) return fn(m);
  }
  return text;
}

export function makeT(locale: PortalLocale): T {
  return (text, vars) => {
    let out = locale === "pt-PT" ? translatePt(text) : text;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
    }
    return out;
  };
}
