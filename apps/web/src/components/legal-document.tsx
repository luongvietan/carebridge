import { getPreferredLocale } from "@/lib/i18n/preference-server";
import type { LegalSection } from "@/data/legal-copy";
import type { LegalDoc, LegalLang } from "@/data/legal-copy-pt";
import { PT_LEGAL_UPDATED } from "@/data/legal-copy-pt";

type LegalDocumentProps = {
  title: string;
  sections: readonly LegalSection[];
  intro?: LegalDoc["intro"];
  facts?: LegalDoc["facts"];
  /** The Portuguese pack's language; omitted for the UK documents. */
  lang?: LegalLang;
};

const UK_UPDATED = { iso: "2026-06-16", label: "16 June 2026" };

export async function LegalDocument({ title, sections, intro, facts, lang }: LegalDocumentProps) {
  const pt = lang ? lang === "pt" : (await getPreferredLocale()) === "pt-PT";
  const updated = lang
    ? { iso: PT_LEGAL_UPDATED.iso, label: PT_LEGAL_UPDATED[lang] }
    : pt
      ? { iso: PT_LEGAL_UPDATED.iso, label: PT_LEGAL_UPDATED.pt }
      : UK_UPDATED;
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-heading">{title}</h1>
      <p className="mt-3 text-sm text-muted">{pt ? "Última atualização do texto" : "Text last updated"}: <time dateTime={updated.iso}>{updated.label}</time></p>
      {intro?.map((paragraph) => (
        <p key={paragraph} className="mt-5 leading-relaxed text-ink">{paragraph}</p>
      ))}
      {facts && (
        <dl className="mt-8 divide-y divide-line rounded-2xl border border-line bg-surface">
          {facts.map((fact) => (
            <div key={fact.label} className="grid gap-1 px-5 py-3 sm:grid-cols-[14rem_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-brand-ink">{fact.label}</dt>
              <dd className="break-words text-ink">
                {fact.href ? <a className="text-brand-strong underline underline-offset-4" href={fact.href}>{fact.value}</a> : fact.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {sections.length > 1 && (
        <nav aria-label={pt ? "Índice do documento" : "Document contents"} className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold text-brand-ink">{pt ? "Neste documento" : "In this document"}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {sections.map((section, index) => <li key={section.title}><a className="text-brand-strong underline underline-offset-4" href={`#legal-section-${index}`}>{section.title}</a></li>)}
          </ul>
        </nav>
      )}
      <div className="mt-8 space-y-10">
        {sections.map((section, index) => (
          <section id={`legal-section-${index}`} tabIndex={-1} className="scroll-mt-28" key={section.title}>
            <h2 className="text-xl font-semibold text-heading">{section.title}</h2>
            {section.intro && (
              <p className="mt-3 leading-relaxed text-ink">{section.intro}</p>
            )}
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-ink">
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-3 space-y-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-ink">
                    <span aria-hidden className="mt-1 text-brand-strong">
                      •
                    </span>
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
            {section.table && (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                  <thead className="bg-surface">
                    <tr>
                      {section.table.headers.map((header) => (
                        <th key={header} scope="col" className="px-4 py-3 font-semibold text-brand-ink">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {section.table.rows.map((row) => (
                      <tr key={row.join("|")}>
                        {row.map((cell, cellIndex) =>
                          cellIndex === 0 ? (
                            <th key={cellIndex} scope="row" className="px-4 py-3 align-top font-medium text-heading">{cell}</th>
                          ) : (
                            <td key={cellIndex} className="px-4 py-3 align-top text-ink">{cell}</td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {section.after?.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-ink">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
