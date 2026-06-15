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
import { TestimonialsSection } from "@/components/testimonials-section";
import { onboardingSteps } from "@/data/marketing-copy";
import { marketingHeading, marketingSection, marketingSubheading } from "@/lib/marketing-ui";

export default function HomePage() {
  return (
    <HomePageMotion>
      <SiteNav />

      <HeroSection />

      <StatsBand />

      <AboutIntroSection />

      <main>
        <ServicesOfferSection />

        <ComplianceShowcase />

        <section className={marketingSection}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>How it works</h2>
            <p className={marketingSubheading}>
              From onboarding to booking — a clear path for professionals, private clients and
              organisations.
            </p>
          </div>
          <div data-reveal-stagger className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {onboardingSteps.map((step, i) => (
              <div key={step.title} data-reveal-child className="relative">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#0c6e4f] text-base font-bold text-white">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {i < onboardingSteps.length - 1 && (
                    <span className="hidden h-px flex-1 bg-[#cfe3d6] md:block" aria-hidden />
                  )}
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#0c4a35] sm:text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <ImportantInfoCallout />

        <TestimonialsSection />

        <CtaBanner />

        <HomeFaqSection />
      </main>

      <SiteFooter />
    </HomePageMotion>
  );
}
