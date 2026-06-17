import type { Metadata } from "next";
import { CtaBanner } from "@/components/cta-banner";
import { ImportantInfoCallout } from "@/components/important-info-callout";
import { CtaPillLink } from "@/components/cta-pill-link";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { MarketingPageMotion } from "@/components/motion/marketing-page-motion";
import { RoleCard } from "@/components/role-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { onboardingSteps, professionalRoles, supportedServices } from "@/data/marketing-copy";
import { marketingImages } from "@/data/marketing-images";
import {
  marketingCardShadow,
  marketingDecorativeNumber,
  marketingHeading,
  marketingSection,
  marketingSubheading,
  marketingSurface,
} from "@/lib/marketing-ui";

export const metadata: Metadata = { title: "Professional roles — CareBridge Connect" };

export default function ServicesPage() {
  return (
    <MarketingPageMotion>
      <SiteNav />

      <MarketingPageHero
        badge="Professional roles"
        title="Professional roles we cover"
        description="Compliance-checked healthcare staffing for private clients and organisations — verified professionals across four roles, matched via booking requests."
        image={marketingImages.pageHero.services}
      />

      <main>
        <section className={marketingSection}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>Four verified role types</h2>
            <p className={`${marketingSubheading} max-w-lg`}>
              Registered nurses, healthcare assistants, support workers and physiotherapists —
              each verified before their first booking.
            </p>
          </div>

          <div data-reveal-stagger className="mt-12 grid gap-6 sm:grid-cols-2">
            {professionalRoles.map((role, i) => {
              const img = marketingImages.roleCards[i];
              return (
                <RoleCard
                  key={role.title}
                  title={role.title}
                  description={role.description}
                  image={img.src}
                  alt={img.alt}
                />
              );
            })}
          </div>
        </section>

        <section className={`${marketingSection} pt-0`}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>Services we support</h2>
            <p className={`${marketingSubheading} max-w-2xl`}>
              Engagements are limited to companionship and other non-regulated activities.
              CareBridge Connect does not provide regulated personal care services.
            </p>
          </div>

          <div data-reveal-stagger className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
            {supportedServices.map((service) => (
              <div
                key={service}
                data-reveal-child
                className={`rounded-2xl bg-white p-5 text-sm font-medium text-[#1e5a33] ${marketingCardShadow}`}
              >
                {service}
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-[#5b6a62]">
            …and other non-regulated activities.
          </p>
        </section>

        <section className={`${marketingSection} pt-0`}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>How it works</h2>
            <p className={marketingSubheading}>
              From onboarding to booking — a clear path for professionals, private clients and
              organisations.
            </p>
          </div>

          <div data-reveal-stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {onboardingSteps.map((step, i) => (
              <div
                key={step.title}
                data-reveal-child
                className={`rounded-[28px] bg-white p-7 ${marketingCardShadow} sm:rounded-[32px]`}
              >
                <span className={`text-5xl font-bold ${marketingDecorativeNumber}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-lg font-bold text-[#1e5a33] sm:text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`${marketingSection} pt-0`}>
          <div
            data-reveal
            className={`rounded-[28px] ${marketingSurface} p-8 text-center sm:rounded-[32px] sm:p-12`}
          >
            <h2 className="text-2xl font-bold tracking-tight text-[#1e5a33] sm:text-3xl">
              Ready to create a booking request?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#5b6a62] sm:text-base">
              Register as a private client or organisation — or join as a verified professional.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <CtaPillLink href="/register?as=client" shadow="lg">
                Create a booking request
              </CtaPillLink>
              <CtaPillLink href="/register?as=professional" variant="secondary" shadow="lg">
                Join as a professional
              </CtaPillLink>
            </div>
          </div>
        </section>

        <ImportantInfoCallout />

        <CtaBanner />
      </main>

      <SiteFooter />
    </MarketingPageMotion>
  );
}
