import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight01Icon, Icon } from "@/components/ui/icon";
import { marketingCardShadow } from "@/lib/marketing-ui";

type RoleCardProps = {
  title: string;
  description: string;
  image: string;
  alt: string;
  href?: string;
};

export function RoleCard({ title, description, image, alt, href }: RoleCardProps) {
  const className = `group block rounded-[28px] bg-white p-3 ${marketingCardShadow} sm:rounded-[32px] sm:p-4`;

  const content = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] sm:rounded-3xl">
        <Image
          src={image}
          alt={alt}
          fill
          data-service-image
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {href ? (
          <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white text-[#445049] shadow-md transition group-hover:scale-105">
            <Icon icon={ArrowUpRight01Icon} size={18} strokeWidth={2} />
          </span>
        ) : null}
      </div>
      <h3 className="mt-5 text-xl font-bold text-[#0c4a35]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">{description}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} data-reveal-child data-service-card className={className}>
        {content}
      </Link>
    );
  }

  return (
    <div data-reveal-child data-service-card className={className}>
      {content}
    </div>
  );
}
