import type { Metadata } from "next";
import { CtaBanner } from "@/components/cta-banner";
import { FaqList } from "@/components/faq-list";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { MarketingPageMotion } from "@/components/motion/marketing-page-motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { faqsForLocale } from "@/data/faqs-locale";
import { localeForCountry } from "@/lib/marketing/market";
import { getSelectedCountry } from "@/lib/marketing/market-server";
import { marketingImages } from "@/data/marketing-images";
import { marketingHeading, marketingSection, marketingSubheading } from "@/lib/marketing-ui";

export const metadata: Metadata = { title: "FAQ — CareBridge Connect" };

export default async function FaqPage() {
  const locale = localeForCountry(await getSelectedCountry());
  const pt = locale === "pt-PT";
  return (
    <MarketingPageMotion>
      <SiteNav />

      <MarketingPageHero
        badge={pt ? "Centro de ajuda" : "Help centre"}
        title={pt ? "Perguntas frequentes" : "Frequently asked questions"}
        description={
          pt
            ? "Respostas de confiança sobre verificação, pedidos de marcação, conformidade, pagamentos e exportação de dados."
            : "Trusted answers about verification, booking requests, compliance blocking, payments and data export."
        }
        image={marketingImages.pageHero.faq}
      />

      <main>
        <section className={marketingSection}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>{pt ? "Perguntas comuns" : "Common questions"}</h2>
            <p className={marketingSubheading}>
              {pt
                ? "Respostas claras sobre verificação, pedidos de marcação, conformidade e exportação de dados — antes de se registar ou criar o seu primeiro pedido."
                : "Clear answers about verification, booking requests, compliance blocking and data export — before you register or create your first request."}
            </p>
          </div>

          <div data-reveal-stagger className="mt-12">
            <FaqList faqs={faqsForLocale(locale)} />
          </div>
        </section>

        <CtaBanner />
      </main>

      <SiteFooter />
    </MarketingPageMotion>
  );
}
