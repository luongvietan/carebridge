import Image from "next/image";
import Link from "next/link";
import { ForwardLink } from "@/components/forward-link";
import { roleImage } from "@/lib/i18n/content";
import { getContentForVisitor } from "@/lib/i18n/server";
import { ArrowUpRight01Icon, Icon } from "@/components/ui/icon";
import { marketingHeading, marketingSection, marketingSubheading } from "@/lib/marketing-ui";

function ServiceCard({
  title,
  description,
  image,
  alt,
}: {
  title: string;
  description: string;
  image: string;
  alt: string;
}) {
  return (
    <Link
      href="/services"
      data-reveal-child
      data-service-card
      className="group block rounded-[28px] bg-white p-3 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.12)] sm:rounded-[32px] sm:p-4"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] sm:rounded-3xl">
        <Image
          src={image}
          alt={alt}
          fill
          data-service-image
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
        <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white text-[#4a4a4a] shadow-md transition group-hover:scale-105">
          <Icon icon={ArrowUpRight01Icon} size={18} strokeWidth={2} />
        </span>
      </div>
      <h3 className="mt-5 text-xl font-bold text-[#1e5a33]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#4a4a4a]">{description}</p>
    </Link>
  );
}

export async function ServicesOfferSection() {
  const { healthRoles, childcareRoles, ui } = await getContentForVisitor();
  const featured = [...healthRoles, ...childcareRoles].filter((r) => r.featuredOnHome);
  return (
    <section className={marketingSection}>
      <div data-reveal className="text-center">
        <h2 className={marketingHeading}>{ui.servicesOffer.heading}</h2>
        <p className={`${marketingSubheading} max-w-lg`}>
          {ui.servicesOffer.sub}
        </p>
      </div>

      <div data-reveal-stagger className="mt-10 grid gap-6 sm:mt-12 lg:grid-cols-3">
        {featured.map((service) => {
          const img = roleImage(service.image);
          return (
            <ServiceCard
              key={service.title}
              title={service.title}
              description={service.description}
              image={img.src}
              alt={img.alt}
            />
          );
        })}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-[#4a4a4a]">
        {ui.servicesOffer.more}{" "}
        <ForwardLink href="/services" className="text-sm text-[#2e7d32] hover:underline">
          {ui.servicesOffer.viewAll}
        </ForwardLink>
      </p>
    </section>
  );
}
