import Image from "next/image";
import { CtaPillLink } from "@/components/cta-pill-link";
import { ctaLabels, registerLinks } from "@/data/marketing-copy";
import { marketingImages } from "@/data/marketing-images";
import { marketingCard, marketingSection } from "@/lib/marketing-ui";

export function CtaBanner() {
  const { ctaBanner } = marketingImages;

  return (
    <section className={`${marketingSection} pb-4 pt-0`}>
      <div className={`relative min-h-[320px] overflow-hidden ${marketingCard} sm:min-h-[360px] lg:min-h-[380px]`}>
        <Image
          src={ctaBanner.src}
          alt={ctaBanner.alt}
          fill
          className="object-cover object-[70%_center]"
          sizes="(max-width: 1280px) 100vw, 1280px"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15" />

        <div className="relative flex min-h-[320px] flex-col justify-center px-8 py-12 sm:min-h-[360px] sm:px-12 sm:py-14 lg:min-h-[380px] lg:max-w-2xl lg:px-14">
          <p className="inline-flex items-center gap-2 text-sm text-white/85">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7ed7a0]" aria-hidden />
            Join the marketplace
          </p>

          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            Compliant staffing, ready when you need it
          </h2>

          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
            Register as a verified professional, or create a booking request as a private client
            or organisation — with compliance, payments and audit trails built in.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <CtaPillLink href={registerLinks.professional} shadow="lg">
              {ctaLabels.joinProfessional}
            </CtaPillLink>
            <CtaPillLink href={registerLinks.client} variant="secondary" shadow="lg">
              {ctaLabels.createBookingRequest}
            </CtaPillLink>
          </div>
        </div>
      </div>
    </section>
  );
}
