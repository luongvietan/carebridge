import Image from "next/image";
import { CtaPillLink } from "@/components/cta-pill-link";
import { ctaLabels, registerLinks } from "@/data/marketing-copy";
import { marketingImages } from "@/data/marketing-images";
import { Icon, StarIcon } from "@/components/ui/icon";
import { marketingCard, marketingSectionShell } from "@/lib/marketing-ui";

export function HeroSection() {
  const { hero, heroAvatars } = marketingImages;

  return (
    <section className={`${marketingSectionShell} pb-2 pt-4 sm:pt-6 lg:pb-4`}>
      <div
        className={`relative mx-auto min-h-[520px] max-w-7xl overflow-hidden ${marketingCard} sm:min-h-[560px] lg:min-h-[600px]`}
      >
        <Image
          src={hero.src}
          alt={hero.alt}
          fill
          priority
          className="object-cover object-[65%_center]"
          sizes="(max-width: 1280px) 100vw, 1280px"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />

        <div className="relative flex min-h-[520px] flex-col justify-between p-6 sm:min-h-[560px] sm:p-8 lg:min-h-[600px] lg:p-10">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-sm text-white backdrop-blur-sm">
            <Icon icon={StarIcon} size={16} color="#7ed7a0" strokeWidth={1.75} />
            <span>Verified healthcare staffing</span>
          </div>

          <div className="mt-auto max-w-2xl pb-2 pt-10 sm:pb-4 lg:max-w-3xl">
            <h1 className="text-[2.35rem] font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
              Compliant healthcare staffing,
              <br />
              simplified
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Connect with verified nurses, healthcare assistants, support workers and
              physiotherapists — screened, assessed and continuously monitored for compliance.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 sm:gap-4">
              <CtaPillLink href={registerLinks.professional} shadow="lg">
                {ctaLabels.joinProfessional}
              </CtaPillLink>
              <CtaPillLink href={registerLinks.client} variant="secondary" shadow="lg">
                {ctaLabels.createBookingRequest}
              </CtaPillLink>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 hidden rounded-2xl bg-white px-5 py-4 shadow-xl sm:block lg:bottom-10 lg:right-10">
            <p className="text-[15px] font-bold text-[#0c4a35]">Compliance built in</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {heroAvatars.map((src, i) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full border-2 border-white object-cover"
                    aria-hidden={i > 0}
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-[#445049]">4 verified role types</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
