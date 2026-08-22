import { AboutIntroSection } from "@/components/about-intro-section";
import { ImportantInfoCallout } from "@/components/important-info-callout";
import { ComplianceShowcase } from "@/components/compliance-showcase";
import { CtaBanner } from "@/components/cta-banner";
import { HomeFaqSection } from "@/components/home-faq-section";
import { HeroSection } from "@/components/hero-section";
import { HomePageMotion } from "@/components/motion/home-page-motion";
import { ServicesOfferSection } from "@/components/services-offer-section";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { StatsBand } from "@/components/stats-band";
import { getSelectedCountry, listMarkets } from "@/lib/marketing/market-server";
import { getDictionaryForVisitor } from "@/lib/i18n/server";
import { marketingHeading, marketingSection, marketingSubheading } from "@/lib/marketing-ui";

export default async function HomePage() {
  // The markets, the visitor's choice and their language all come from server
  // state: the `countries` table owns what exists and what is live, the cookie
  // owns which one was picked.
  const [markets, selectedCountry, t] = await Promise.all([
    listMarkets(),
    getSelectedCountry(),
    getDictionaryForVisitor(),
  ]);

  return (
    <HomePageMotion>
      <SiteNav />

      <HeroSection
        markets={markets}
        selected={selectedCountry}
        badge={t.heroBadge}
        headline={t.heroHeadline}
        subheadline={t.heroSubheadline}
        joinLabel={t.joinProfessional}
        requestLabel={t.createBookingRequest}
      />

      <StatsBand labels={t.statsBandLabels} />

      <AboutIntroSection />

      <main>
        <ServicesOfferSection />

        <ComplianceShowcase />

        <section className={marketingSection}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>{t.howItWorksHeading}</h2>
            <p className={marketingSubheading}>{t.howItWorksSubheading}</p>
          </div>
          <div
            data-reveal-stagger
            className="mt-12 grid gap-10 sm:grid-cols-2 md:gap-8 lg:grid-cols-4"
          >
            {t.onboardingSteps.map((step, i) => (
              <div key={step.title} data-reveal-child className="relative">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#2e7d32] text-base font-bold text-white">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {i < t.onboardingSteps.length - 1 && (
                    <span className="hidden h-px flex-1 bg-[#cfe3d6] md:block" aria-hidden />
                  )}
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#1e5a33] sm:text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4a4a4a]">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <ImportantInfoCallout />

        <CtaBanner />

        <HomeFaqSection />
      </main>

      <SiteFooter />
    </HomePageMotion>
  );
}
