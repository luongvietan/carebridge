import Image from "next/image";
import Link from "next/link";
import { ForwardLink } from "@/components/forward-link";
import { professionalRoles } from "@/data/marketing-copy";
import { marketingImages } from "@/data/marketing-images";
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
        <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white text-[#445049] shadow-md transition group-hover:scale-105">
          <Icon icon={ArrowUpRight01Icon} size={18} strokeWidth={2} />
        </span>
      </div>
      <h3 className="mt-5 text-xl font-bold text-[#0c4a35]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">{description}</p>
    </Link>
  );
}

export function ServicesOfferSection() {
  return (
    <section className={marketingSection}>
      <div data-reveal className="text-center">
        <h2 className={marketingHeading}>Professional roles we cover</h2>
        <p className={`${marketingSubheading} max-w-lg`}>
          Registered nurses, healthcare assistants, support workers and physiotherapists —
          available for booking requests from private clients and organisations.
        </p>
      </div>

      <div data-reveal-stagger className="mt-10 grid gap-6 sm:mt-12 lg:grid-cols-3">
        {professionalRoles.slice(0, 3).map((service, i) => {
          const img = marketingImages.roleCards[i];
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

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-[#5b6a62]">
        Physiotherapists (HCPC-registered) are also available for rehabilitation and mobility
        programmes.{" "}
        <ForwardLink href="/services" className="text-sm text-[#0c6e4f] hover:underline">
          View all four roles
        </ForwardLink>
      </p>
    </section>
  );
}
