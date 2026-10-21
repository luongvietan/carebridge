"use client";

import { FaqList } from "@/components/faq-list";
import { ForwardLink } from "@/components/forward-link";
import type { FaqEntry } from "@/data/faqs-locale";
import { marketingHeading, marketingSection, marketingSubheading } from "@/lib/marketing-ui";

export function HomeFaqSection({ faqs, locale = "en-GB" }: { faqs: readonly FaqEntry[]; locale?: string }) {
  const pt = locale === "pt-PT";
  return (
    <section className={`${marketingSection} max-sm:pb-8`}>
      <div data-reveal className="text-center">
        <h2 className={marketingHeading}>{pt ? "Perguntas frequentes" : "Frequently asked questions"}</h2>
        <p className={marketingSubheading}>
          {pt
            ? "Respostas claras sobre verificação, pedidos de marcação, conformidade e exportação de dados — antes de se registar ou criar o seu primeiro pedido."
            : "Clear answers about verification, booking requests, compliance blocking and data export — before you register or create your first request."}
        </p>
      </div>

      <div data-reveal-stagger className="mt-12">
        <FaqList faqs={faqs.slice(0, 5)} locale={locale} />
      </div>

      <p data-reveal className="mt-8 text-center text-sm text-ink">
        <ForwardLink href="/faq" className="text-sm text-brand-strong hover:underline">
          {pt ? "Ver todas as perguntas" : "View all questions"}
        </ForwardLink>
      </p>
    </section>
  );
}
