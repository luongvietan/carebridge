import type { LegalSection } from "@/data/legal-copy";

type LegalDocumentProps = {
  title: string;
  sections: readonly LegalSection[];
};

export function LegalDocument({ title, sections }: LegalDocumentProps) {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-[#14301e]">{title}</h1>
      <div className="mt-8 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold text-[#14301e]">{section.title}</h2>
            {section.intro && (
              <p className="mt-3 leading-relaxed text-[#4a4a4a]">{section.intro}</p>
            )}
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-[#4a4a4a]">
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-3 space-y-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-[#4a4a4a]">
                    <span aria-hidden className="mt-1 text-[#2e7d32]">
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
