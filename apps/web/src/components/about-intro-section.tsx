import Image from "next/image";
import { CtaPillLink } from "@/components/cta-pill-link";
import { aboutFeatures } from "@/data/marketing-copy";
import { marketingImages } from "@/data/marketing-images";
import { CheckmarkCircle01Icon, Icon, StarIcon } from "@/components/ui/icon";
import { marketingHeading, marketingSection } from "@/lib/marketing-ui";

const imageShell =
  "relative overflow-hidden rounded-[28px] shadow-[0_16px_40px_-16px_rgba(15,38,28,0.28)] sm:rounded-[32px]";

export function AboutIntroSection() {
  const { about, aboutAvatars } = marketingImages;

  return (
    <section className={marketingSection}>
      <div data-reveal className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
        <h2 className={`max-w-3xl leading-tight ${marketingHeading}`}>
          A secure healthcare marketplace — only suitable, verified professionals join
          our platform
        </h2>

        <div className="flex shrink-0 items-center gap-4">
          <div className="flex items-center gap-2">
            <Icon icon={StarIcon} size={20} color="#f5a623" strokeWidth={1.75} />
            <span className="text-lg font-bold text-[#1e5a33]">Compliance-first</span>
          </div>
          <div className="flex -space-x-2.5">
            {aboutAvatars.map((src) => (
              <Image
                key={src}
                src={src}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-white object-cover"
              />
            ))}
          </div>
        </div>
      </div>

      <div
        data-reveal-stagger
        className="mt-12 grid grid-cols-12 items-center gap-4 sm:gap-5 lg:mt-16 lg:gap-6 xl:gap-8"
      >
        {/* Ảnh nhỏ — cột hẹp */}
        <div
          data-reveal-child
          className={`${imageShell} col-span-5 h-[220px] sm:h-[260px] lg:col-span-3 lg:h-[340px]`}
        >
          <Image
            src={about.primary.src}
            alt={about.primary.alt}
            fill
            className="object-cover object-top"
            sizes="(max-width: 1024px) 38vw, 220px"
          />
        </div>

        {/* Ảnh to — cột rộng */}
        <div
          data-reveal-child
          className={`${imageShell} col-span-7 h-[280px] sm:h-[340px] lg:col-span-4 lg:h-[460px]`}
        >
          <Image
            src={about.secondary.src}
            alt={about.secondary.alt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 58vw, 380px"
          />
        </div>

        {/* Text */}
        <div data-reveal-child className="col-span-12 flex flex-col justify-center pt-2 lg:col-span-5 lg:pt-0">
          <p className="text-[15px] leading-[1.7] text-[#33433a] sm:text-base sm:leading-relaxed">
            CareBridge Connect provides a secure, compliant onboarding journey for healthcare
            professionals and a straightforward booking process for private clients and
            organisations — with eligibility screening, competency assessment, document
            verification and continuous compliance tracking built in.
          </p>

          <ul className="mt-7 space-y-3.5 sm:mt-8">
            {aboutFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Icon
                  icon={CheckmarkCircle01Icon}
                  size={22}
                  color="#2e7d32"
                  strokeWidth={1.75}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-sm font-medium leading-snug text-[#1e5a33] sm:text-[15px]">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 sm:mt-9">
            <CtaPillLink href="/register" shadow="lg">
              Get started
            </CtaPillLink>
          </div>
        </div>
      </div>
    </section>
  );
}
