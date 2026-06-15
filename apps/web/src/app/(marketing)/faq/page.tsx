import type { Metadata } from "next";
import { CtaBanner } from "@/components/cta-banner";
import { FaqList } from "@/components/faq-list";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { MarketingPageMotion } from "@/components/motion/marketing-page-motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { faqs } from "@/data/faqs";
import { marketingImages } from "@/data/marketing-images";
import { marketingHeading, marketingSection, marketingSubheading } from "@/lib/marketing-ui";

export const metadata: Metadata = { title: "FAQ — CareBridge Connect" };

export default function FaqPage() {
  return (
    <MarketingPageMotion>
      <SiteNav />

      <MarketingPageHero
        badge="Help centre"
        title="Frequently asked questions"
        description="Trusted answers about verification, booking requests, compliance blocking, payments and data export."
        image={marketingImages.pageHero.faq}
      />

      <main>
        <section className={marketingSection}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>Common questions</h2>
            <p className={marketingSubheading}>
              Clear answers about verification, booking requests, compliance blocking and data
              export — before you register or create your first request.
            </p>
          </div>

          <div data-reveal-stagger className="mt-12">
            <FaqList faqs={faqs} />
          </div>
        </section>

        <CtaBanner />
      </main>

      <SiteFooter />
    </MarketingPageMotion>
  );
}
