import type { LegalSection } from "@/data/legal-copy";
import { getSelectedCountry } from "@/lib/marketing/market-server";

type LegalDocumentProps = {
  title: string;
  sections: readonly LegalSection[];
};

export async function LegalDocument({ title, sections }: LegalDocumentProps) {
  const pt = (await getSelectedCountry()) === "PT";
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-heading">{title}</h1>
      <p className="mt-3 text-sm text-muted">{pt ? "Última atualização do texto" : "Text last updated"}: <time dateTime={pt ? "2026-10-05" : "2026-06-16"}>{pt ? "5 de outubro de 2026" : "16 June 2026"}</time></p>
      <nav aria-label={pt ? "Índice do documento" : "Document contents"} className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-semibold text-brand-ink">{pt ? "Neste documento" : "In this document"}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {sections.map((section, index) => <li key={section.title}><a className="text-brand-strong underline underline-offset-4" href={`#legal-section-${index}`}>{section.title}</a></li>)}
        </ul>
      </nav>
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
          </section>
        ))}
      </div>
    </>
  );
}
