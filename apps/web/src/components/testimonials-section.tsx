import Image from "next/image";
import { Icon, QuoteUpIcon, StarIcon } from "@/components/ui/icon";
import {
  testimonials,
  testimonialsSection,
  type Testimonial,
} from "@/data/marketing-copy";
import { marketingHeading, marketingSection, marketingSubheading, marketingSurface } from "@/lib/marketing-ui";

function StarRating({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-[#7a8a81]">Grade</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-[#0c4a35]">5.0</span>
          <div className="flex gap-0.5" aria-label="5 out of 5 stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon key={i} icon={StarIcon} size={12} color="#0c4a35" strokeWidth={1.75} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#7a8a81]">Grade</span>
      <span className="text-sm font-semibold text-[#0c4a35]">5.0</span>
      <div className="flex gap-0.5" aria-label="5 out of 5 stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon key={i} icon={StarIcon} size={14} color="#0c6e4f" strokeWidth={1.75} />
        ))}
      </div>
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const { quote, name, role, featured, photo } = testimonial;

  if (featured && photo) {
    return (
      <figure
        className={`flex flex-col rounded-[28px] ${marketingSurface} p-4 sm:flex-row sm:items-stretch sm:p-5 lg:col-span-2 lg:p-6`}
      >
        <div className="shrink-0 sm:flex sm:items-stretch">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-[22px] sm:mx-0 sm:h-auto sm:min-h-[240px] sm:w-40 sm:max-w-none lg:w-48 lg:rounded-[24px]">
            <Image src={photo} alt="" fill className="object-cover" sizes="(max-width: 640px) 220px, 192px" />
          </div>
        </div>

        <div className="mt-4 flex min-w-0 flex-1 flex-col sm:mt-0 sm:pl-5 lg:pl-6">
          <Icon icon={QuoteUpIcon} size={32} color="#0c6e4f" strokeWidth={1.75} />
          <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-[#445049] sm:mt-4">
            {quote}
          </blockquote>

          <div className="mt-5 border-t border-[#e3ece6] pt-4 sm:mt-6">
            <div className="flex items-center gap-4">
              <figcaption className="min-w-0 flex-1">
                <p className="font-semibold text-[#0c4a35]">{name}</p>
                <p className="mt-0.5 text-sm text-[#7a8a81]">{role}</p>
              </figcaption>
              <div className="h-10 w-px shrink-0 bg-[#e3ece6]" aria-hidden />
              <StarRating compact />
            </div>
          </div>
        </div>
      </figure>
    );
  }

  return (
    <figure className={`flex flex-col rounded-[28px] ${marketingSurface} p-6 lg:col-span-1`}>
      <Icon icon={QuoteUpIcon} size={32} color="#0c6e4f" strokeWidth={1.75} />
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-[#445049]">{quote}</blockquote>
      <div className="mt-6 flex items-end justify-between gap-4">
        <figcaption>
          <p className="font-semibold text-[#0c4a35]">{name}</p>
          <p className="mt-0.5 text-sm text-[#7a8a81]">{role}</p>
        </figcaption>
        <StarRating />
      </div>
    </figure>
  );
}

export function TestimonialsSection() {
  return (
    <section className={marketingSection}>
      <div className="text-center">
        <h2 className={marketingHeading}>{testimonialsSection.heading}</h2>
        <p className={marketingSubheading}>{testimonialsSection.subheading}</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((testimonial) => (
          <TestimonialCard key={testimonial.name} testimonial={testimonial} />
        ))}
      </div>
    </section>
  );
}
