import type { LegalSection } from "@/data/legal-copy";

type LegalDocumentProps = {
  title: string;
  sections: readonly LegalSection[];
};

export function LegalDocument({ title, sections }: LegalDocumentProps) {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-[#0f261c]">{title}</h1>
      <div className="mt-8 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold text-[#0f261c]">{section.title}</h2>
            {section.intro && (
              <p className="mt-3 leading-relaxed text-[#5b6a62]">{section.intro}</p>
            )}
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-[#5b6a62]">
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-3 space-y-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-[#5b6a62]">
                    <span aria-hidden className="mt-1 text-[#0c6e4f]">
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
