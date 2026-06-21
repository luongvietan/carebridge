"use client";

import { FaqList } from "@/components/faq-list";
import { ForwardLink } from "@/components/forward-link";
import { faqs } from "@/data/faqs";
import { marketingHeading, marketingSection, marketingSubheading } from "@/lib/marketing-ui";

export function HomeFaqSection() {
  return (
    <section className={marketingSection}>
      <div data-reveal className="text-center">
        <h2 className={marketingHeading}>Frequently asked questions</h2>
        <p className={marketingSubheading}>
          Clear answers about verification, booking requests, compliance blocking and data export
          — before you register or create your first request.
        </p>
      </div>

      <div data-reveal-stagger className="mt-12">
        <FaqList faqs={faqs.slice(0, 5)} />
      </div>

      <p data-reveal className="mt-8 text-center text-sm text-[#4a4a4a]">
        <ForwardLink href="/faq" className="text-sm text-[#2e7d32] hover:underline">
          View all questions
        </ForwardLink>
      </p>
    </section>
  );
}
